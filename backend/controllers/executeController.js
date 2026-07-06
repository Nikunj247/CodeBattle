import axios from 'axios';
import Problem from '../models/Problem.js';
import User from '../models/User.js'; // MUST BE IMPORTED

// Judge0 Language IDs
const LANGUAGE_IDS = {
  cpp: 54,  // C++ (GCC 9.2.0)
  java: 62, // Java (OpenJDK 13)
};

export const executeCode = async (req, res) => {
  const { problemId, sourceCode, language, isSubmit, userId, mode } = req.body;

  // === ANTI-CHEAT 1: PAYLOAD BOMB PREVENTION ===
  if (!sourceCode || sourceCode.length > 15000) {
    return res.status(400).json({ 
      success: false, 
      status: 'Error', 
      output: 'Code exceeds maximum allowed length (15,000 characters).' 
    });
  }

  try {
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, status: 'Error', output: 'Problem not found' });
    }

    const hiddenDriverCode = problem.driverCode ? problem.driverCode[language] : '';
    let finalCode = sourceCode;

    if (hiddenDriverCode) {
      if (language === 'java') {
        const importRegex = /import\s+[\w\.*]+;/g;
        const sourceImports = sourceCode.match(importRegex) || [];
        const driverImports = hiddenDriverCode.match(importRegex) || [];
        const cleanSource = sourceCode.replace(importRegex, '').trim();
        const cleanDriver = hiddenDriverCode.replace(importRegex, '').trim();
        const allImports = [...new Set([...sourceImports, ...driverImports])].join('\n');
        
        if (cleanDriver.includes('// {{USER_CODE}}')) {
          finalCode = `${allImports}\n\n${cleanDriver.replace('// {{USER_CODE}}', cleanSource)}`;
        } else {
          finalCode = `${allImports}\n\n${cleanSource}\n\n${cleanDriver}`; 
        }
      } 
      else if (language === 'cpp') {
        const includeRegex = /#include\s*[<"].*?[>"]/g;
        const sourceIncludes = sourceCode.match(includeRegex) || [];
        const driverIncludes = hiddenDriverCode.match(includeRegex) || [];
        const cleanSource = sourceCode.replace(includeRegex, '').trim();
        const cleanDriver = hiddenDriverCode.replace(includeRegex, '').trim();
        const allIncludes = [...new Set([...sourceIncludes, ...driverIncludes])].join('\n');
        
        if (cleanDriver.includes('// {{USER_CODE}}')) {
          finalCode = `${allIncludes}\n\n${cleanDriver.replace('// {{USER_CODE}}', cleanSource)}`;
        } else {
          finalCode = `${allIncludes}\n\n${cleanSource}\n\n${cleanDriver}`;
        }
      } 
      else {
        finalCode = `${sourceCode}\n\n${hiddenDriverCode}`;
      }
    }

    const testCasesToRun = isSubmit ? problem.testCases : [problem.testCases[0]];
    
    let maxTime = 0;
    let maxMemory = 0;
    let lastOutput = '';

    for (let i = 0; i < testCasesToRun.length; i++) {
      const testCase = testCasesToRun[i];

      const options = {
        method: 'POST',
        url: `https://${process.env.JUDGE0_HOST}/submissions`,
        params: { base64_encoded: 'true', wait: 'true' },
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
          'X-RapidAPI-Host': process.env.JUDGE0_HOST
        },
        data: {
          language_id: LANGUAGE_IDS[language],
          source_code: Buffer.from(finalCode).toString('base64'),
          stdin: Buffer.from(testCase.input).toString('base64'),
          expected_output: Buffer.from(testCase.expectedOutput).toString('base64'),
          
          // === ANTI-CHEAT 2: STRICT TIMEOUTS & MEMORY LIMITS ===
          cpu_time_limit: 2.0,       // Kill infinite loops after exactly 2 seconds
          memory_limit: 128000,      // Max 128MB of RAM per execution
          wall_time_limit: 5.0       // Kill entirely if stuck for 5 seconds
        }
      };

      const response = await axios.request(options);
      const { status, time, memory } = response.data;

      const stdout = response.data.stdout ? Buffer.from(response.data.stdout, 'base64').toString('utf-8') : '';
      const stderr = response.data.stderr ? Buffer.from(response.data.stderr, 'base64').toString('utf-8') : '';
      const compile_output = response.data.compile_output ? Buffer.from(response.data.compile_output, 'base64').toString('utf-8') : '';

      if (time && parseFloat(time) > maxTime) maxTime = parseFloat(time);
      if (memory && memory > maxMemory) maxMemory = memory;
      lastOutput = stdout;

      if (status.id !== 3) {
        let errorMsg = stdout;
        let frontendStatus = 'Execution Error';

        if (status.id === 6) {
          frontendStatus = 'Compilation Error';
          errorMsg = compile_output;
        } 
        else if (status.id >= 7 && status.id <= 12) {
          frontendStatus = 'Runtime Error';
          errorMsg = stderr;
        } 
        else if (status.id === 4) {
          frontendStatus = 'Wrong Answer';
          errorMsg = `Test Case ${i + 1} Failed.\n\nInput:\n${testCase.input}\n\nExpected Output:\n${testCase.expectedOutput}\n\nYour Output:\n${stdout || '[No Output]'}`;
        } 
        else if (status.id === 5) {
          frontendStatus = 'Time Limit Exceeded';
          errorMsg = `Execution took too long on Test Case ${i + 1}. (Infinite loop detected)`;
        }

        return res.status(200).json({
          success: false,
          status: frontendStatus,
          output: errorMsg || status.description
        });
      }
    }

    // === NEW: PROGRESSION TRACKING ===
    // Count progression for practice and official ranked matches. Ignore private duels.
    if (isSubmit && (mode === 'practice' || mode === 'ranked') && userId) {
      try {
        await User.findByIdAndUpdate(userId, {
          $addToSet: { solvedProblems: problemId }
        });
      } catch (dbError) {
        console.error("Failed to update user solved status:", dbError);
      }
    }

    let finalOutputMessage = isSubmit 
      ? `All ${testCasesToRun.length} testcases passed successfully!` 
      : `Input:\n${testCasesToRun[0].input}\n\nExpected Output:\n${testCasesToRun[0].expectedOutput}\n\nYour Output:\n${lastOutput || '[No Output]'}`;

    return res.status(200).json({
      success: true,
      status: 'Accepted',
      output: finalOutputMessage,
      time: maxTime.toFixed(3),
      memory: maxMemory
    });

  } catch (error) {
    console.error("Execution error:", error);
    return res.status(500).json({ 
      success: false, 
      status: 'Server Error',
      output: 'Failed to communicate with Judge0 servers.' 
    });
  }
};