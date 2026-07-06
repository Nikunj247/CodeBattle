import fs from 'fs';

const inputPath = './problems.json';
const outputPath = './problems.json'; // We will overwrite the file with the fixed version

const runExtractor = () => {
  console.log('📖 Reading problems.json...');
  let rawData;
  try {
    rawData = fs.readFileSync(inputPath, 'utf-8');
  } catch (err) {
    console.error('❌ Could not find problems.json. Make sure the path is correct.');
    return;
  }

  const problems = JSON.parse(rawData);
  let successCount = 0;

  problems.forEach(prob => {
    const desc = prob.description;
    const testCases = [];

    // Regex to hunt down LeetCode's Input and Output lines
    const inputRegex = /Input:\s*(.*)/g;
    const outputRegex = /Output:\s*(.*)/g;

    let inputMatch;
    let outputMatch;

    const inputs = [];
    const outputs = [];

    // Extract all raw inputs and outputs from the description text
    while ((inputMatch = inputRegex.exec(desc)) !== null) {
      inputs.push(inputMatch[1].trim());
    }
    while ((outputMatch = outputRegex.exec(desc)) !== null) {
      // Sometimes LeetCode has explanations on the same line as output, 
      // we just want the array/number part.
      outputs.push(outputMatch[1].trim());
    }

    // Pair them up and clean the formatting
    for (let i = 0; i < Math.min(inputs.length, outputs.length); i++) {
      
      // Transform: "nums = [2,7,11,15], target = 9"  --->  "2 7 11 15 9"
      let cleanInput = inputs[i]
        .replace(/[a-zA-Z0-9_]+\s*=\s*/g, '') // Removes "variableName = "
        .replace(/\[/g, '')                   // Removes open brackets
        .replace(/\]/g, '')                   // Removes close brackets
        .replace(/,/g, ' ')                   // Replaces commas with spaces
        .replace(/"/g, '')                    // Removes quotes from strings
        .replace(/\s+/g, ' ')                 // Normalizes multiple spaces into one
        .trim();
      
      // Transform: "[0,1]" ---> "0 1"
      let cleanOutput = outputs[i]
        .replace(/\[/g, '')
        .replace(/\]/g, '')
        .replace(/,/g, ' ')
        .replace(/"/g, '')
        .trim();

      testCases.push({
        input: cleanInput,
        expectedOutput: cleanOutput
      });
    }

    // If we successfully extracted test cases, replace the dummy placeholders!
    if (testCases.length > 0) {
      prob.testCases = testCases;
      successCount++;
    }
    
    // OPTIONAL: If you want to delete the Examples from the description so the UI is cleaner
    // Uncomment the line below:
    // prob.description = desc.split('Example 1:')[0].trim();
  });

  // Save the newly formatted JSON back to the file
  fs.writeFileSync(outputPath, JSON.stringify(problems, null, 2), 'utf-8');
  
  console.log(`\n✅ Extraction Complete!`);
  console.log(`Successfully extracted real test cases for ${successCount} out of ${problems.length} problems.`);
  console.log(`📁 Saved updated data to: ${outputPath}`);
};

runExtractor();