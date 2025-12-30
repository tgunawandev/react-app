import { PaymentInvoiceAllocation } from './PaymentInvoiceAllocation'
import { PaymentPhoto } from './PaymentPhoto'

export interface PaymentEntry{
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
	/**	Series : Select	*/
	naming_series: "PAY-.YYYY.-" | "PAY-SFA-.YYYY.-"
	/**	Customer : Link - Customer	*/
	customer: string
	/**	Customer Name : Data	*/
	customer_name?: string
	/**	Payment Date : Date	*/
	payment_date: string
	/**	Sales Visit : Link - Sales Visit	*/
	sales_visit?: string
	/**	Payment Type : Select	*/
	payment_type: "Inbound" | "Outbound"
	/**	Payment Amount Type : Select	*/
	payment_type_selection?: "Full" | "Partial"
	/**	Payment Method : Select	*/
	payment_method: "Cash" | "Bank Transfer" | "Check" | "Credit Card" | "Mobile Payment"
	/**	Odoo Journal ID : Int - Odoo Journal ID (from account.journal) - fetched dynamically based on Operating Unit	*/
	journal_id?: number
	/**	Journal Name : Data - Journal name from Odoo (e.g., 'CASH COLL-CPN', 'BANK INTRASIT-CPN')	*/
	journal_name?: string
	/**	Status : Select	*/
	status: "Draft" | "Submitted" | "Verified" | "Approved" | "Synced to Odoo" | "Sync Failed" | "Cancelled"
	/**	Payment Amount : Currency	*/
	amount: number
	/**	Currency : Link - Currency	*/
	currency?: string
	/**	Reference No : Data - Check number, transfer reference, etc.	*/
	reference_no?: string
	/**	Reference Date : Date	*/
	reference_date?: string
	/**	Notes : Text	*/
	notes?: string
	/**	Invoices : Table - Payment Invoice Allocation	*/
	invoices?: PaymentInvoiceAllocation[]
	/**	Total Allocated : Currency	*/
	total_allocated?: number
	/**	Unallocated Amount : Currency	*/
	unallocated_amount?: number
	/**	Verified By : Link - User	*/
	verified_by?: string
	/**	Verified Date : Datetime	*/
	verified_date?: string
	/**	Approved By : Link - User	*/
	approved_by?: string
	/**	Approved Date : Datetime	*/
	approved_date?: string
	/**	Odoo Payment ID : Int	*/
	odoo_id?: number
	/**	Odoo Payment Number : Data - Original Odoo payment number	*/
	odoo_name?: string
	/**	Odoo State : Select - Odoo payment state: draft, posted, cancel	*/
	odoo_state?: "draft" | "posted" | "cancel"
	/**	Sync Status : Select	*/
	odoo_sync_status?: "Not Synced" | "Pending Sync" | "Synced to Odoo" | "Synced from Odoo" | "Sync Error"
	/**	Last Sync : Datetime	*/
	last_sync_timestamp?: string
	/**	Sync Error Message : Text	*/
	sync_error_message?: string
	/**	Check-in Latitude : Float	*/
	check_in_latitude?: number
	/**	Check-in Longitude : Float	*/
	check_in_longitude?: number
	/**	SR Signature : Signature	*/
	sr_signature?: any
	/**	Photos : Table - Payment Photo	*/
	photos?: PaymentPhoto[]
}