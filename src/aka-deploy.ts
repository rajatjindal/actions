import * as actions from './actions'
import * as aka from './aka'
import * as core from '@actions/core'

async function run(): Promise<void> {
	try {
		const buildEnabled =
			core.getBooleanInput('run_build') === false ? false : true
		if (buildEnabled) {
			await actions.build()
		}

		const token = core.getInput('fermyon_aka_token', {required: true})
		await aka.login(token)

		const appUrl = await actions.aka_deploy()
		core.setOutput('app-url', appUrl)
		core.info(`your app is deployed and available at ${appUrl}`)
	} catch (error) {
		if (error instanceof Error) core.setFailed(error.message)
	}
}

run()
