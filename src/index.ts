import { Document as WorkflowRun } from "../flow_generated/types/estuary/public/examples/flow-github/workflow_runs";
import { Document as CiSummary } from "../flow_generated/types/estuary/public/examples/flow-github/ci-runs-by-day";

/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env { }

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		let body = await request.text();
		let input = JSON.parse(body) as [[WorkflowRun]];
		// Our response will be a multidimensional array, and each input maps to an array in the output.
		let outputs: [[CiSummary]] = [];
		for (var source of input[0]) {
			try {
				outputs.push([tryMapDocument(source)]);
			} catch (e) {
				console.log("could not map source:", e, source);
				outputs.push([])
			}
		}

		let responseJson = JSON.stringify(outputs);
		return new Response(responseJson, {
			headers: {
				"Content-Type": "application/json"
			}
		});
	},
};

function nonNull<T>(name: string, val: T | null): T {
	if (val === null) {
		throw `${name} is null or undefined`
	}
	return val!
}

function tryMapDocument(input: WorkflowRun): CiSummary {
		let timestamp = nonNull("run_started_at", input.run_started_at);
		let date = timestamp.split("T")[0]
		
		return {
			repo: nonNull("repository.name", input.repository?.name),
			workflow: nonNull("name", input.name),
			branch: nonNull("head_branch", input.head_branch),
			outcome: nonNull("conclusion", input.conclusion),
			date: date,
			totalRuns: 1,
			totalTimeSeconds: (Date.parse(input.updated_at) - Date.parse(input.run_started_at)) / 1000
		};
}


