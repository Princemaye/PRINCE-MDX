const cmd = require("../command");
const config = require("../config");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");

function copyFolderSync(source, destination, excludeList = []) {
    if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
    }

    const items = fs.readdirSync(source);

    for (const item of items) {
        const srcPath = path.join(source, item);
        const destPath = path.join(destination, item);
        const relativePath = path.relative(source, srcPath);

        if (excludeList.some(ex => 
            relativePath === ex || 
            relativePath.startsWith(ex + path.sep)
        )) continue;

        const stat = fs.statSync(srcPath);

        if (stat.isDirectory()) {
            copyFolderSync(srcPath, destPath, excludeList);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

cmd({
    pattern: "update",
    desc: "Update bot to latest version",
    category: "owner",
    react: "🆕",
    filename: __filename
},
async (conn, mek, m, { reply, isOwner }) => {

    if (!isOwner) {
        return reply("❌ Owner Only Command");
    }

    try {
        await reply("🔍 Checking for Updates...");

        const repo = "Princemaye/PRINCE-MDX";
        const branch = "main";

        // Get latest commit
        const { data } = await axios.get(
            `https://api.github.com/repos/${repo}/commits/${branch}`
        );

        const latestCommit = data.sha;
        const commitMsg = data.commit.message;
        const author = data.commit.author.name;
        const date = new Date(data.commit.author.date).toLocaleString();

        await reply(
`🔄 Updating Bot...

👤 Author: ${author}
📅 Date: ${date}
💬 Message: ${commitMsg}

Downloading update...`
        );

        // Download ZIP
        const zipUrl = `https://github.com/${repo}/archive/${branch}.zip`;
        const zipPath = path.join(__dirname, "../update.zip");

        const response = await axios.get(zipUrl, {
            responseType: "arraybuffer"
        });

        fs.writeFileSync(zipPath, response.data);

        // Extract ZIP
        const extractPath = path.join(__dirname, "../latest");
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);

        const sourcePath = path.join(
            extractPath,
            `PRINCE-MDX-${branch}`
        );

        const destinationPath = path.join(__dirname, "..");

        // Files to keep safe
        const excludeList = [
        ".env",
        "mayel/prince.db",
        "mayel/session",
      ];


        copyFolderSync(sourcePath, destinationPath, excludeList);

        // Cleanup
        fs.unlinkSync(zipPath);
        fs.rmSync(extractPath, { recursive: true, force: true });

        await reply("✅ Update Complete!\nRestarting...");

        setTimeout(() => {
            process.exit(0);
        }, 2000);

    } catch (err) {
        console.log(err);
        reply("❌ Update Failed. Try manual redeploy.");
    }

});
