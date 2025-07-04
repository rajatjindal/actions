import * as exec from '@actions/exec'
import * as spin from './spin'
import * as fs from 'fs-extra'

export interface App {
  id: string
  name: string
  created_at: string
  urls: string[]
}

export async function login(token: string): Promise<void> {
  await exec.exec('spin', ['aka', 'login', '--token', token])
}

export async function getAppByName(
  name: string,
  accountId: string,
): Promise<App> {
  const args = ['aka', 'app', 'status', '--format=json', `--app-name=${name}`]
  if (accountId) {
    args.push(`--account-id=${accountId}`)
  }

  const result = await exec.getExecOutput('spin', args)
  if (result.exitCode !== 0) {
    throw new Error(
      `failed to get app using app-name with [status_code: ${result.exitCode}] [stdout: ${result.stdout}] [stderr: ${result.stderr}] `
    )
  }

  return JSON.parse(result.stdout)
}

export async function getAppInCurrentDir(): Promise<App> {
  const args = ['aka', 'app', 'status', '--format=json']
  const result = await exec.getExecOutput('spin', args)
  if (result.exitCode !== 0) {
    throw new Error(
      `failed to get app using app-name with [status_code: ${result.exitCode}] [stdout: ${result.stdout}] [stderr: ${result.stderr}] `
    )
  }

  return JSON.parse(result.stdout)
}

export async function linkWorkspace(
  app: App,
): Promise<void> {
  const args = ['aka', 'app', 'link', '--app-name', app.name]
  // TODO(rajatjindal): it seems app status does not return the account id
  // if (app.account_id) {
  //   args.push('--account-id')
  //   args.push(app.account_id)
  // }

  const result = await exec.getExecOutput('spin', args)
  if (result.exitCode !== 0) {
    throw new Error(
      `failed to link app to workspace with [status_code: ${result.exitCode}] [stdout: ${result.stdout}] [stderr: ${result.stderr}] `
    )
  }
}

export async function deploy(
  manifestFile: string,
  accountId: string,
  nameOverride: string,
  variables: string[]
): Promise<App> {
  const manifest = spin.getAppManifest(manifestFile)
  const deployAs = nameOverride && nameOverride !== '' ? nameOverride : manifest.name
  var appAlreadyLinked = fs.pathExistsSync('.spin-aka/config.toml')

  // if .spin-aka folder exists, skip naming etc.
  // if we decide to do previews, then we probably should also
  // check if nameOverride is provided.
  if (!appAlreadyLinked) {
    try {
      const existingApp = await getAppByName(deployAs, accountId)
      await linkWorkspace(existingApp)
      appAlreadyLinked = true
    } catch (error) {
      // ignore error for now.
    }
  }

  // TODO(rajatjindal): some of these may be exclusive. should add validation for that.
  const args = ['aka', 'deploy', '--no-confirm', '-f', manifestFile]
  for (const variable of variables) {
    args.push('--variable')
    args.push(variable)
  }

  if (!appAlreadyLinked && accountId) {
    args.push(`--account-id=${accountId}`)
  }

  if (!appAlreadyLinked && deployAs) {
    args.push(`--create-name=${deployAs}`)
  }

  const result = await exec.getExecOutput('spin', args)
  if (result.exitCode !== 0) {
    throw new Error(
      `deploy failed with [status_code: ${result.exitCode}] [stdout: ${result.stdout}] [stderr: ${result.stderr}] `
    )
  }

  return getAppInCurrentDir()
}


export async function deleteAppById(
  id: string,
): Promise<void> {
  const args = ['aka', 'app', 'delete', '--app-id', id]
  const result = await exec.getExecOutput('spin', args)
  if (result.exitCode !== 0) {
    throw new Error(
      `failed to delete app with [status_code: ${result.exitCode}] [stdout: ${result.stdout}] [stderr: ${result.stderr}] `
    )
  }
}