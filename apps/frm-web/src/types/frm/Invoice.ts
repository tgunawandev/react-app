import { InvoiceItem } from './InvoiceItem'

export interface Invoice{
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
	/**	Invoice Number : Data	*/
	invoice_number: string
	/**	Customer : Data	*/
	customer?: string
	/**	Invoice Date : Date	*/
	invoice_date?: string
	/**	Due Date : Date	*/
	due_date?: string
	/**	State : Select	*/
	state?: "Draft" | "Posted" | "Cancelled"
	/**	Payment Status : Select	*/
	payment_state?: "Not Paid" | "In Payment" | "Paid" | "Partial" | "Reversed"
	/**	Items : Table - Invoice Item	*/
	items?: InvoiceItem[]
	/**	Untaxed Amount : Currency	*/
	amount_untaxed?: number
	/**	Tax : Currency	*/
	amount_tax?: number
	/**	Total : Currency	*/
	amount_total?: number
	/**	Amount Due : Currency	*/
	amount_residual?: number
	/**	Odoo ID : Int	*/
	odoo_id?: number
	/**	Odoo Name : Data - Invoice number from Odoo (e.g., INV/2025/00123)	*/
	odoo_name?: string
	/**	Odoo State : Data - Invoice state from Odoo (draft/posted/cancel)	*/
	odoo_state?: string
	/**	Sync Status : Data	*/
	odoo_sync_status?: string
	/**	Last Sync : Datetime	*/
	last_sync_timestamp?: string
	/**	Sales Team : Link - Sales Team	*/
	sales_team?: string
	/**	Operating Unit : Link - Operating Unit	*/
	operating_unit?: string
}