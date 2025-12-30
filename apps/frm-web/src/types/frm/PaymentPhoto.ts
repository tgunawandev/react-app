
export interface PaymentPhoto{
	name: string
	creation: string
	modified: string
	owner: string
	modified_by: string
	docstatus: 0 | 1 | 2
	parent?: string
	parentfield?: string
	parenttype?: string
	idx?: number
	/**	Photo : Attach Image	*/
	photo: string
	/**	Caption : Data	*/
	caption?: string
	/**	Uploaded At : Datetime	*/
	uploaded_at?: string
}