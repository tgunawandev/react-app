
export interface PaymentInvoiceAllocation{
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
	/**	Invoice : Link - Invoice	*/
	invoice: string
	/**	Invoice Number : Data	*/
	invoice_number?: string
	/**	Invoice Date : Date	*/
	invoice_date?: string
	/**	Outstanding Amount : Currency	*/
	outstanding_amount?: number
	/**	Allocated Amount : Currency	*/
	allocated_amount: number
}