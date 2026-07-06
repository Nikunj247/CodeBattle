import fs from 'fs';

const FILE_PATH = 'season1_problems.json';

try {
    // 1. Read the existing file
    const rawData = fs.readFileSync(FILE_PATH, 'utf8');
    const problems = JSON.parse(rawData);
    let updatedCount = 0;

    // 2. Loop through and inject the placeholders
    problems.forEach(problem => {
        let isUpdated = false;

        // Check and update C++ Driver Code
        if (problem.driverCode && problem.driverCode.cpp) {
            if (!problem.driverCode.cpp.includes('// {{USER_CODE}}')) {
                problem.driverCode.cpp = problem.driverCode.cpp.replace(
                    /int main\s*\(/g, 
                    '// {{USER_CODE}}\n\nint main('
                );
                isUpdated = true;
            }
        }

        // Check and update Java Driver Code
        if (problem.driverCode && problem.driverCode.java) {
            if (!problem.driverCode.java.includes('// {{USER_CODE}}')) {
                problem.driverCode.java = problem.driverCode.java.replace(
                    /public class Main\s*\{/g, 
                    '// {{USER_CODE}}\n\npublic class Main {'
                );
                isUpdated = true;
            }
        }

        if (isUpdated) updatedCount++;
    });

    // 3. Overwrite the exact same file with the updated data
    fs.writeFileSync(FILE_PATH, JSON.stringify(problems, null, 2));
    
    console.log(`✅ Success! Injected {{USER_CODE}} into ${updatedCount} problems.`);
    console.log(`The file '${FILE_PATH}' has been successfully overwritten.`);

} catch (error) {
    console.error("❌ Error updating the file:", error.message);
}