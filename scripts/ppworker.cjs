const { execSync } = require('child_process')
const fs = require('fs-extra')
const path = require('path')
const ppconfig = require('./ppconfig.json')

const updateAppName = async (appName) => {
    // workerflow build app showName
    try {
        const plistPath = path.join(__dirname, '../PakePlus/Info.plist')
        execSync(
            `plutil -replace CFBundleDisplayName -string "${appName}" "${plistPath}"`
        )
        console.log(`✅ Updated app_name to: ${appName}`)
    } catch (error) {
        console.error('❌ Error updating app name:', error)
    }
}

const updateWebUrl = async (webUrl) => {
    try {
        // Assuming ContentView.swift
        const contentViewPath = path.join(
            __dirname,
            '../PakePlus/ContentView.swift'
        )
        let content = await fs.readFile(contentViewPath, 'utf8')
        content = content.replace(
            /WebView\(url: URL\(string: ".*?"\)!\)/,
            `WebView(url: URL(string: "${webUrl}")!)`
        )
        await fs.writeFile(contentViewPath, content)
        console.log(`✅ Updated web URL to: ${webUrl}`)
    } catch (error) {
        console.error('❌ Error updating web URL:', error)
    }
}

const updateDebug = async (debug) => {
    // update debug
    const webViewPath = path.join(__dirname, '../PakePlus/WebView.swift')
    let content = await fs.readFile(webViewPath, 'utf8')
    content = content.replace(/let debug = false/, `let debug = ${debug}`)
    await fs.writeFile(webViewPath, content)
    console.log(`✅ Updated debug to: ${debug}`)
}

// set github env
const setGithubEnv = (name, version, pubBody) => {
    console.log('setGithubEnv......')
    const envPath = process.env.GITHUB_ENV
    if (!envPath) {
        console.error('GITHUB_ENV is not defined')
        return
    }
    try {
        const entries = {
            NAME: name,
            VERSION: version,
            PUBBODY: pubBody,
        }
        for (const [key, value] of Object.entries(entries)) {
            if (value !== undefined) {
                fs.appendFileSync(envPath, `${key}=${value}\n`)
            }
        }
        console.log('✅ Environment variables written to GITHUB_ENV')
        console.log(fs.readFileSync(envPath, 'utf-8'))
    } catch (err) {
        console.error('❌ Failed to parse config or write to GITHUB_ENV:', err)
    }
    console.log('setGithubEnv success')
}

// update android applicationId
const updateBundleId = async (newBundleId) => {
    // Write back only if changes were made
    const pbxprojPath = path.join(
        __dirname,
        '../PakePlus.xcodeproj/project.pbxproj'
    )
    try {
        console.log(`Updating Bundle ID to ${newBundleId}...`)
        let content = fs.readFileSync(pbxprojPath, 'utf8')
        content = content.replaceAll(
            /PRODUCT_BUNDLE_IDENTIFIER = (.*?);/g,
            `PRODUCT_BUNDLE_IDENTIFIER = ${newBundleId};`
        )
        fs.writeFileSync(pbxprojPath, content)
        console.log(`✅ Updated Bundle ID to: ${newBundleId} success`)
    } catch (error) {
        console.error('Error updating Bundle ID:', error)
    }
}

const main = async () => {
    const { name, showName, version, webUrl, id, pubBody, debug } = ppconfig.ios

    // Update app name if provided
    await updateAppName(showName)

    // Update web URL if provided
    await updateWebUrl(webUrl)

    // update debug
    await updateDebug(debug)

    // update android applicationId
    await updateBundleId(id)

    // set github env
    setGithubEnv(name, version, pubBody)

    // success
    console.log('✅ Worker Success')
}

// run
try {
    ;(async () => {
        console.log('🚀 worker start')
        await main()
        console.log('🚀 worker end')
    })()
} catch (error) {
    console.error('❌ Worker Error:', error)
}
