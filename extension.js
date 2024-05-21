// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');
const axios = require('axios')

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vsca-code" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vsca-code.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Vsca Code!');
	});

	context.subscriptions.push(disposable);

	let runSca = vscode.commands.registerCommand('vsca-code.runSCA', () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            const folderPath = workspaceFolders[0].uri.fsPath;
            listFiles(folderPath);
        } else {
            vscode.window.showInformationMessage('Scan failed!');
        }
    });

    context.subscriptions.push(runSca);
}

function listFiles(dir) {
    fs.readdir(dir, (err, files) => {
        if (err) {
            vscode.window.showErrorMessage(`Error reading directory: ${err.message}`);
            return;
        }
        files.forEach(file => {
			if(file == "requirements.txt"){
				parseRequirementsAndOSV(`${dir}/${file}`, "PyPI");
			}
        });
    });

	
}

function parseRequirementsAndOSV(filename, ecosystem) {
    const content = fs.readFileSync(filename, 'utf-8');
    const lines = content.split('\n');
    lines.map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(line => {
            let [component, version] = line.split('==');
			osv(component,version, ecosystem)
        });
}

async function osv(component, version, ecosystem){
	vscode.window.showInformationMessage(`Chamando OSV`);
	const OSV_API_URL = "https://api.osv.dev/v1/query";
    const query = {
        package: {
            ecosystem: ecosystem,
            name: component
        }
    };
    if (version) {
        query.version = version;
    }
	try {
        const response = await axios.post(OSV_API_URL, query);
        const data = response.data;
        if (data.vulns) {
            data.vulns.forEach((vuln) =>{
				console.log("test: " + JSON.stringify(vuln));
				vscode.window.showInformationMessage(`${component} ${version}: ${vuln.summary}`);
			})
        }
    } catch (error) {
        vscode.window.showInformationMessage(`Error fetching vulnerabilities for ${component}: ${error.message}`);
    }
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
