# PteroPub

PteroPub is a small TypeScript CLI tool to upload files to Pterodactyl server based on a config. This is primarily aimed at developers who want to quickly upload their files and run tasks on their server, such as reloading or restarts. It may also be used as a part of a CI/CD pipeline.

## Configuration

### pteropub.json

Create a `pteropub.json` file in the root of your project. Here is a minimal config:

```json
{
    "uploads": [
        {
            "token": "API_TOKEN",
            "panelUrl": "https://your.panel.dev",
            "serverId": "503a33ee",
            "restartServer": false,
            "task": "Name of Some Schedule",
            "delayToNext": 1000,
            "files": [
                {
                    "localFile": "scratch/somefile.jar",
                    "uploadDir": "/plugins"
                },
                {
                    "localFile": "scratch/someotherfile.jar",
                    "uploadDir": "/plugins"
                }
            ]
        }
    ]
}
```

- `uploads` is an array of upload configurations. You can have multiple configurations if you have multiple servers.
    - `token` is the API token for the server. This is required.
    - `panelUrl` is the URL of the panel before `/api`. This is required.
    - `serverId` is the short server ID found after `/server/` in the URL. This is required.
    - `restartServer` is a boolean to restart the server after the files are uploaded. Defaults to `false`.
    - `task` is the name of the task to run after the files are uploaded. Defaults to `null`.
    - `delayToNext` is the time in milliseconds to wait before moving to the next upload configuration. Defaults to `0`.
    - `files` is an array of files to upload. At least one file entry is required.
        - `localFile` is the path to the file on your local machine. This is required.
        - `uploadDir` is the directory on the server to upload the file to. Be sure to include the leading `/`. This is required.


### Environment Variables

The config can also be passed as the environment variable `PTEROPUB_CONFIG`. When set, this will take precedence over the `pteropub.json` file.

### Ignoring The Configuration

If using in a git repository, you'll likely want to add `pteropub.json` to your `.gitignore` file. This is because the API token is sensitive information and should not be shared.

```gitignore
pteropub.json
```

If you are working on a project that does not wish to add this to the `.gitignore` file, you can add it to your global gitignore file. This is usually located at `~/.gitignore_global`. You can then run the following command to add it to your global gitignore file:

#### macOS, Linux, and Windows Git Bash

```bash
echo "pteropub.json" >> ~/.gitignore
git config --global core.excludesfile ~/.gitignore
```

#### Windows PowerShell

```ps1
Add-Content -Path "$Env:USERPROFILE\.gitignore" -Value "pteropub.json"
git config --global core.excludesFile "$Env:USERPROFILE\.gitignore"
```

## Running

### Prerequisites

You'll need to install NodeJS to run this tool.

#### Windows PowerShell

```ps1
winget install -e --id OpenJS.NodeJS.LTS
```

#### macOS

```bash
# Install Homebrew if you haven't already
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node
```

#### Linux

Use your package manager to install NodeJS. For example, on Ubuntu:

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - &&\
sudo apt install -y nodejs
```

### Usage

Run in a directory containing a `pteropub.json` file:

```bash
npx pteropub
```

You can also install it globally for easier use:

```bash
npm install -g pteropub
pteropub
```