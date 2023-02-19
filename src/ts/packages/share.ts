import { Machine, pass } from "./state.js"

type ShareStates = {
	Closed: void
	Opened: void
	Sharing: { title: string }
	Shared: { url: URL, embed: URL }
}

type ShareEvents = {
	Close: ShareStates["Closed"]
	Open: ShareStates["Opened"]
	ShareStart: ShareStates["Sharing"]
	ShareEnd: ShareStates["Shared"]
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
