const vscode = require('vscode');
const fs = require('fs');
const { exec } = require('child_process');
const fs1 = require('fs').promises;
const path = require('path');
const { chromium } = require('playwright');
const { JSDOM } = require("jsdom");
const prettier = require("prettier");

const USER_DATA_DIR = path.join(__dirname, 'browser_data'); 
let functionName1;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Function Planner extension is now active!');
    
    let helloWorldCommand = vscode.commands.registerCommand('task-planner.helloWorld', () => {
        vscode.window.showInformationMessage('Hello from Function Planner!');
    });

    const taskPlannerProvider = new TaskPlannerProvider();
    vscode.window.registerTreeDataProvider('taskPlannerView', taskPlannerProvider);

    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(checklist) Function Planner";
    statusBarItem.tooltip = "Click to process files";
    statusBarItem.command = "task-planner.processFiles";
    statusBarItem.show();
     

    const workspaceFolders = vscode.workspace.workspaceFolders;
    // Register a command to process files
    const processFilesCommand = vscode.commands.registerCommand('task-planner.processFiles', async function () {
      
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("No workspace opened.");
            return;
        }
		// console.log(workspaceFolders[0].uri.fsPath);
		const files = getAllFiles(workspaceFolders[0].uri.fsPath);
		vscode.window.showInformationMessage(`Found ${files.length} files.`); 
     
        // console.log(files);
    });



    const treeDataProvider = new CustomTreeDataProvider();
    vscode.window.registerTreeDataProvider('customView', treeDataProvider);
   
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.inputFunction', async () => {
            const value = await vscode.window.showInputBox({ prompt: 'Enter Function Name' });
            if (value) {
                treeDataProvider.functionName = value;
                functionName1=value;
                // treeDataProvider.refresh();
            }
        }),

        vscode.commands.registerCommand('extension.inputFile', async () => {
            const value = await vscode.window.showInputBox({ prompt: 'Enter File Name' });
            if (value) {
                treeDataProvider.fileName = value;
                // treeDataProvider.refresh();
            }
        }),

        vscode.commands.registerCommand('extension.selectOption', async () => {
            const options = ['Write the complete function.', 'Enhance the function.', 'Finalize the function and remove all comments'];
            const value = await vscode.window.showQuickPick(options, { placeHolder: 'Choose an option' });
            if (value) {
                treeDataProvider.selectedOption = value;
                // treeDataProvider.refresh();
            }
        }),

        vscode.commands.registerCommand('extension.submit', () => {
            if (
                treeDataProvider.functionName !== "Enter function name" &&
                treeDataProvider.fileName !== "Enter file name" &&
                treeDataProvider.selectedOption !== "Choose an option"
            ) {
                treeDataProvider.saveData();
                vscode.window.showInformationMessage(`Data saved! Check the console for details.`);
                getParticularFile(workspaceFolders[0].uri.fsPath,treeDataProvider)
                // getAllFiles();
            } else {
                vscode.window.showErrorMessage("Fill all inputs before submitting.");
            }
        })
    );

    context.subscriptions.push(helloWorldCommand, statusBarItem, processFilesCommand);
}

/**
 * Sidebar View: Task Planner Provider
 */
class TaskPlannerProvider {
    constructor() {
        this.functionName = "Enter function name";
        this.fileName = "Enter file name";
        this.selectedOption = "Choose an option";
    }

    getChildren() {
        const functionItem = new vscode.TreeItem(`Function: ${this.functionName}`, vscode.TreeItemCollapsibleState.None);
        functionItem.command = {
            command: "extension.inputFunction",
            title: "Enter Function Name"
        };

        const fileItem = new vscode.TreeItem(`File: ${this.fileName}`, vscode.TreeItemCollapsibleState.None);
        fileItem.command = {
            command: "extension.inputFile",
            title: "Enter File Name"
        };

        const optionItem = new vscode.TreeItem(`Option: ${this.selectedOption}`, vscode.TreeItemCollapsibleState.None);
        optionItem.command = {
            command: "extension.selectOption",
            title: "Choose Option"
        };

        const submitButton = new vscode.TreeItem(
            "🔘 Plan Your Code",
            vscode.TreeItemCollapsibleState.None
        );
        submitButton.command = {
            command: "extension.submit",
            title: "Submit",
            tooltip: "Plan your code",
        };

        submitButton.command.disabled = !(this.functionName !== "Enter function name" &&
            this.fileName !== "Enter file name" &&
            this.selectedOption !== "Choose an option");

        return [functionItem, fileItem, optionItem, submitButton];
    }

    getTreeItem(element) {
        return element;
    }
    
    
}

/**
 * Recursively get all files in the workspace
 * @param {string} dirPath
 * @returns {Promise<string[]>}
 */
async function getAllFiles(dirPath) {
    let results = [];
	console.log('DirectionPath,',dirPath);
    const list = fs.readdirSync(dirPath);

    for (let file of list) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);

        // Ignore "node_modules" folder
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                results = results.concat(await getAllFiles(fullPath)); // Recursive call
            }
        } else {
            // Filter only .js, .json, and .md files
            if (fullPath.endsWith('.js') || fullPath.endsWith('.json') || fullPath.endsWith('.md')) {
                results.push(fullPath);
            }
        }
    }
    // console.log(results); // Logs only the filtered files
    return results;
}


async function getParticularFile(dirPath,data) {
    let results = [];
    
    console.log("jfkjfsifsj");
    console.log(data.savedData)


	console.log('DirectionPath,',dirPath);
    const list = fs.readdirSync(dirPath);

    for (let file of list) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);

        // Ignore "node_modules" folder
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                results = results.concat(await getParticularFile(fullPath,data)); // Recursive call
            }
        } else {
            // Filter only .js, .json, and .md files
            if (fullPath.endsWith(data.savedData.fileName)) {
                readFileContent(fullPath,data);
                // results.push(fullPath);
                break;
            }
        }
    }
    console.log(results); 
    // readFileContent(results[1]);// Logs only the filtered files
    // return results;s
}





async function readFileContent(filePath,data) {
    try {
        console.log(filePath);
        const content = await fs1.readFile(path.resolve(filePath), 'utf-8');
        // console.log(content);
        sendToChatGPT(content,data)
        // return content;
    } catch (error) {
        console.error('Error reading file:', error);
    }
}








class CustomTreeDataProvider {
    constructor() {
        this.functionName = "Enter function name";
        this.fileName = "Enter file name";
        this.selectedOption = "Choose an option";
        this.savedData = null; // Variable to store submitted data
    }

    getChildren() {
        const functionItem = new vscode.TreeItem(`Function: ${this.functionName}`, vscode.TreeItemCollapsibleState.None);
        functionItem.command = {
            command: "extension.inputFunction",
            title: "Enter Function Name"
        };

        const fileItem = new vscode.TreeItem(`File: ${this.fileName}`, vscode.TreeItemCollapsibleState.None);
        fileItem.command = {
            command: "extension.inputFile",
            title: "Enter File Name"
        };

        const optionItem = new vscode.TreeItem(`Option: ${this.selectedOption}`, vscode.TreeItemCollapsibleState.None);
        optionItem.command = {
            command: "extension.selectOption",
            title: "Choose Option"
        };

        const submitButton = new vscode.TreeItem("🔘 Plan Your Code", vscode.TreeItemCollapsibleState.None);
        submitButton.command = {
            command: "extension.submit",
            title: "Submit",
            tooltip: "Plan your code",
        };

        return [functionItem, fileItem, optionItem, submitButton];
    }

    getTreeItem(element) {
        return element;
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    saveData() {
        this.savedData = {
            functionName: this.functionName,
            fileName: this.fileName,
            selectedOption: this.selectedOption,
        };
        console.log("Saved Data:", this.savedData);
    }
}




/**
 * Extracts JavaScript code from an HTML string and saves it to a file.
 * @param {string} codeElementHTML - The extracted HTML containing the <code> block.
 * @param {string} fileName - The name of the file to save (e.g., "output.js").
 */
async function saveExtractedCode(codeElementHTML) {
    // if (!codeElementHTML || typeof codeElementHTML !== "string") {
    //     console.error("Error: Invalid <code> element HTML.");
    //     return;
    // }
      const fileName='output.js'
    // Parse the HTML string into a DOM structure
    const dom = new JSDOM(codeElementHTML);
    const document = dom.window.document;

    // Select the <code> element inside the parsed DOM
    let codeElement = document.querySelector("code");

    if (!codeElement) {
        console.error("Error: No <code> element found in parsed HTML.");
        return;
    }

    // Extract all text inside the <code> block, including nested spans
    let extractedCode =await  extractTextRecursively(codeElement);

    // Define the output file path inside the VS Code workspace
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage("No workspace opened.");
        return;
    }

    const outputFilePath = path.join(workspaceFolders[0].uri.fsPath, fileName);
     
    const formattedCode = prettier.format(extractedCode, { parser: "babel" });
    console.log(formattedCode)
    fs.writeFileSync(outputFilePath, extractedCode, "utf8");
    // // Write the extracted JavaScript code into a file
    // fs.writeFileSync(outputFilePath, extractedCode, "utf8");

    console.log(`Extracted JavaScript code saved to: ${outputFilePath}`);
    vscode.window.showInformationMessage(`Your Plan Functions  are Generated and saved to ${fileName}`);
}

/**
 * Recursively extracts text content from an element, handling nested spans.
 * @param {Element} element - The DOM element to extract text from.
 * @returns {string} - Extracted text content.
 */
function extractTextRecursively(element) {
    let text = "";
    
    element.childNodes.forEach((node) => {
        if (node.nodeType === 3) {
            // If it's a text node, append its text content
            text += node.textContent;
        } else if (node.nodeType === 1) {
            // If it's an element (e.g., <span>), recurse into it
            text += extractTextRecursively(node);
        }
    });

    return text;
}











async function sendToChatGPT(content,data) {
    const prompt=`The whole file content is ${content}  and we want to ${data.savedData.selectedOption} and write the only  rewrite the function ${functionName1} and make function ${functionName1} ${data.saveData.selectedOption} and only write function and does not write anything extra above and below and also does not any other line of code other than this ${functionName1} function`;
    showLoader();
    const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
        headless: false, // Set to true if you want it hidden
        args: ['--disable-dev-shm-usage', '--no-sandbox'] // Improve stability
    });
 
    // Get or create a new page
    let page = context.pages()[0] || await context.newPage();
    await page.goto('https://gemini.google.com/app/5d9e84a2bb3fce3e?hl=en-IN');
    await page.waitForTimeout(9000);
    await page.locator("//div[@data-placeholder='Ask Gemini']").first().fill(prompt);
    await page.waitForTimeout(9000);
    await page.locator("//button[@aria-label='Send message']").first().click();
    await page.waitForTimeout(10000);
    const lastCodeElement = await page.locator("//code").last();
    const fullElement = await lastCodeElement.evaluate(node => node.outerHTML);
    
    console.log(fullElement);
    await page.close();
   
    saveExtractedCode(fullElement);
    vscode.window.showInformationMessage("✅ Task Completed!");

    
}


async  function showLoader() {
    vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: "Function Planner",
            cancellable: false,
        },
        async (progress) => {
            progress.report({ message: "Planning and Generating the function for your code..." });

            // Run loader for 10 seconds, but don’t block other execution
            await new Promise((resolve) => setTimeout(resolve, 30000));

            // vscode.window.showInformationMessage("✅s Task Completed!");
        }
    );
}












function deactivate() {}

module.exports = { activate, deactivate };