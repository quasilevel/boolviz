type Discriminated<T> = {
	[K in keyof T]: {
		state: K,
		data: T[K]
	}
}

type DiscriminatedUnion<T> = Discriminated<T>[keyof T]

type Transitions<States, Events, DiscriminatedStates extends Discriminated<States> = Discriminated<States>> = {
	[From in keyof DiscriminatedStates]?: {
		[Event in keyof Events]?: (arg: Events[Event], from: DiscriminatedStates[From]["data"]) => DiscriminatedStates[keyof DiscriminatedStates]
	}
}

type EventListners<Events> = {
	[Key in keyof Events]?: Set<(data: Events[Key]) => void>
}

export class Machine<States, Events> {
	#current: DiscriminatedUnion<States>
	#stateEvents: EventListners<States> = {}
	#exitEvents: EventListners<States> = {}
	#debug = false

	constructor(current: DiscriminatedUnion<States>, private transitions: Transitions<States, Events>) {
		this.#current = current
	}

	get current() {
		return this.#current
	}

	set debug(val: boolean) {
		this.#debug = val
	}

	on<State extends keyof States>(event: State, handler: (data: States[State]) => void) {
		if (this.#debug) {
			console.debug("set state handler", { event, handler })
			console.trace()
		}
		if (typeof this.#stateEvents[event] === "undefined") {
			this.#stateEvents[event] = new Set([handler])
			return
		}
		this.#stateEvents[event]!.add(handler)
	}

	exit<State extends keyof States>(event: State, handler: (data: States[State]) => void) {
		if (this.#debug) {
			console.debug("set exit handler", { event, handler })
			console.trace()
		}
		if (typeof this.#stateEvents[event] === "undefined") {
			this.#exitEvents[event] = new Set([handler])
			return
		}
		this.#exitEvents[event]!.add(handler)
	}

	trigger<Event extends keyof Events>(event: Event, data: Events[Event]): boolean {
		if (this.#debug) {
			console.debug("trigger event", { event, data })
			console.trace()
		}
		const handler = this.transitions[this.#current.state]?.[event]
		if (typeof handler === "undefined") {
			return false
		}

		const previous = this.#current

		this.#current = handler(data, this.#current.data)
		if (this.#debug) {
			console.log("new state", this.#current)
			console.trace()
		}

		this.#stateEvents[this.#current.state]?.forEach(h => h(this.#current.data))

		this.#exitEvents[previous.state]?.forEach(h => h(previous.data))
		return true
	}
}

export const pass = <State extends string, Data>(state: State) => (data: Data) => ({ state, data })
