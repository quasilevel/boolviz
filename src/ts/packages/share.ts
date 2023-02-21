import { Machine, pass } from "./state.js"
import { getShareState } from "../boolviz.js"

type ShareStates = {
	Closed: void
	Opened: void
	Sharing: { title: string, circuit: ReturnType<typeof getShareState> }
	Shared: { url: URL, embed: URL }
}

type ShareEvents = {
	Close: ShareStates["Closed"]
	Open: ShareStates["Opened"]
	ShareStart: ShareStates["Sharing"]
	ShareEnd: ShareStates["Shared"]
}

const share = async (data: ShareStates["Sharing"]) => {
	const response = await fetch(
		"https://keogami-pocketbase.fly.dev/api/collections/circuits/records",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ ...data, version: "v1.1.0"})
		}
	)

	return await response.json() as {
		id: string,
	}
}

export const shareMachine = new Machine<ShareStates, ShareEvents>({
	data: undefined,
	state: "Closed"
}, {
		Closed: {
			Open: pass("Opened")
		},
		Opened: {
			Close: pass("Closed"),
			ShareStart: pass("Sharing")
		},
		Sharing: {
			ShareEnd: pass("Shared")
		},
		Shared: {
			Close: pass("Closed")
		}
	})

const shareURL = (id: string) => {
	const url = new URL(location.origin)
	url.searchParams.set("share", id)
	return url
}
const embedURL = (share: URL) => {
	const url = new URL(share)
	url.searchParams.set("embed", "true")
	return url
}

shareMachine.on("Sharing", async data => {
	const { id } = await share(data)
	const url = shareURL(id)
	const embed = embedURL(url)

	shareMachine.trigger("ShareEnd", {
		url, embed
	})
})
