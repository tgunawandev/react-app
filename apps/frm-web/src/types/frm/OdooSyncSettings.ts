
export interface OdooSyncSettings{
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
	/**	Days to Sync (from today) : Int - Number of days to look back when syncing transactions (Sales Orders, Invoices, Deliveries). Default is 90 days (3 months).	*/
	transaction_days_to_sync: number
	/**	Sync ALL Transactions (Ignore Date Filter) : Check - If enabled, sync ALL transactions regardless of date filter (WARNING: This can take a very long time!)	*/
	sync_all_transactions?: 0 | 1
	/**	Use Write Date Filter : Check - Use write_date field from Odoo to filter records. If unchecked, uses transaction date fields (order_date, invoice_date, etc.)	*/
	use_write_date_filter?: 0 | 1
	/**	Duplicate Check Enabled : Check - Check if record already exists in Frappe before creating (uses odoo_id field)	*/
	duplicate_check_enabled?: 0 | 1
	/**	Update Existing Records : Check - Update existing records if they already exist (based on odoo_id match)	*/
	update_existing_records?: 0 | 1
}