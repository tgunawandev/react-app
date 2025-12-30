
export interface OdooSyncLog{
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
	/**	Sync Direction : Select	*/
	sync_direction: "ERPNext to Odoo" | "Odoo to ERPNext"
	/**	Source DocType : Data	*/
	source_doctype: string
	/**	Source Document Name : Data	*/
	source_docname: string
	/**	Target DocType : Data	*/
	target_doctype?: string
	/**	Target Document Name : Data	*/
	target_docname?: string
	/**	Odoo Record ID : Data - ID of the corresponding record in Odoo	*/
	odoo_record_id?: string
	/**	Sync Status : Select	*/
	sync_status: "Success" | "Failed" | "Pending" | "Pending-Sync-Retry-1" | "Pending-Sync-Retry-2" | "Pending-Sync-Retry-3" | "Failed-Manual-Review-Required"
	/**	Sync Timestamp : Datetime	*/
	sync_timestamp: string
	/**	Error Message : Text - Detailed error message if sync failed	*/
	error_message?: string
	/**	Retry Count : Int	*/
	retry_count?: number
	/**	Payload Summary : Text - Summary of synced data payload	*/
	payload_summary?: string
	/**	Sync Duration (seconds) : Float - Time taken for sync operation in seconds	*/
	sync_duration?: number
	/**	API Endpoint : Data - Odoo API endpoint called	*/
	api_endpoint?: string
	/**	Request Method : Select	*/
	request_method?: "GET" | "POST" | "PUT" | "DELETE"
	/**	Created By : Link - User	*/
	created_by: string
}