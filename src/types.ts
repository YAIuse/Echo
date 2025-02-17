export type EchoSearchParams = {
	[key: string]:
		| string
		| number
		| boolean
		| null
		| undefined
		| Array<string | number | boolean | null | undefined>
}
