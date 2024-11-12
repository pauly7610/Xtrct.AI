# dependency_check.ps1

# Node Version
"### Node Version ###" | Out-File -FilePath dependency_check_output.txt -Append
node -v | Out-File -FilePath dependency_check_output.txt -Append

# Yarn Version
"### Yarn Version ###" | Out-File -FilePath dependency_check_output.txt -Append
yarn -v | Out-File -FilePath dependency_check_output.txt -Append

# Expo CLI Version
"### Expo CLI Version ###" | Out-File -FilePath dependency_check_output.txt -Append
expo --version | Out-File -FilePath dependency_check_output.txt -Append

# Installed Expo SDK Version
"### Installed Expo SDK Version ###" | Out-File -FilePath dependency_check_output.txt -Append
yarn list --pattern expo | Out-File -FilePath dependency_check_output.txt -Append

# react-native-screens Version
"### react-native-screens Version ###" | Out-File -FilePath dependency_check_output.txt -Append
yarn list --pattern react-native-screens | Out-File -FilePath dependency_check_output.txt -Append

# List of Dependencies
"### List of Dependencies ###" | Out-File -FilePath dependency_check_output.txt -Append
Get-Content package.json | Out-File -FilePath dependency_check_output.txt -Append

# Metro Config
"### Metro Config ###" | Out-File -FilePath dependency_check_output.txt -Append
if (Test-Path metro.config.js) {
    Get-Content metro.config.js | Out-File -FilePath dependency_check_output.txt -Append
} else {
    "No metro.config.js file found." | Out-File -FilePath dependency_check_output.txt -Append
}

# Project Directory Structure
"### Project Directory Structure ###" | Out-File -FilePath dependency_check_output.txt -Append
Get-ChildItem -Recurse | Out-File -FilePath dependency_check_output.txt -Append

# Environment Variables
"### Environment Variables ###" | Out-File -FilePath dependency_check_output.txt -Append
if (Test-Path .env) {
    Get-Content .env | Out-File -FilePath dependency_check_output.txt -Append
} else {
    "No .env file found." | Out-File -FilePath dependency_check_output.txt -Append
}
