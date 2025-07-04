import * as actions from './actions'
import * as aka from './aka'
import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  try {
    if (!github.context.payload.pull_request) {
      throw new Error(`this action currently support deploying apps on PR only`)
    }

    const prNumber = github.context.payload.pull_request.number
    if (core.getBooleanInput('undeploy')) {
      await actions.undeployPreview(prNumber)
      return
    }

    const token = core.getInput('fermyon_aka_token', {required: true})
    await aka.login(token)
    await actions.build()
    const appUrl = await actions.deployAkaPreview(prNumber)
    core.setOutput('app-url', appUrl)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
