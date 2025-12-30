
export interface SFASettings{
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
	/**	GPS Required for Check-In : Check - Require GPS capture for visit check-in	*/
	gps_required?: 0 | 1
	/**	GPS Tolerance (meters) : Float - Maximum allowed distance between check-in GPS and customer GPS	*/
	gps_tolerance_meters?: number
	/**	Photo Required : Check - Require photo evidence for all visits	*/
	photo_required?: 0 | 1
	/**	Minimum Visit Duration (minutes) : Int - Minimum required visit duration	*/
	minimum_visit_duration?: number
	/**	QR Code Scan Mandatory : Check - Require QR code scanning for all visits	*/
	qr_code_mandatory?: 0 | 1
	/**	POD Photo Required : Check - Require photo for Proof of Delivery	*/
	pod_photo_required?: 0 | 1
	/**	POD Signature Required : Check - Require signature for Proof of Delivery	*/
	pod_signature_required?: 0 | 1
	/**	POD GPS Required : Check - Require GPS capture for Proof of Delivery	*/
	pod_gps_required?: 0 | 1
	/**	POD Receiver Name Required : Check - Require receiver name for Proof of Delivery	*/
	pod_receiver_required?: 0 | 1
	/**	Auto-Submit Threshold : Currency - Orders below this amount are auto-submitted	*/
	auto_submit_threshold?: number
	/**	Approval Required Above : Currency - Orders above this amount require manager approval	*/
	approval_required_above?: number
	/**	Enable Notifications : Check	*/
	notifications_enabled?: 0 | 1
	/**	Notify on Visit Complete : Check	*/
	notify_on_visit_complete?: 0 | 1
	/**	Enable Route Optimization : Check - Use algorithm to optimize route planning	*/
	route_optimization_enabled?: 0 | 1
	/**	Default Optimization Algorithm : Select	*/
	default_optimization_algorithm?: "Nearest Neighbor" | "Genetic Algorithm" | "Simulated Annealing"
	/**	Enable Odoo Sync : Check - Enable bidirectional synchronization with Odoo ERP	*/
	enable_odoo_sync?: 0 | 1
	/**	Odoo Base URL : Data - Base URL of your Odoo instance (e.g., http://localhost:16069)	*/
	odoo_base_url?: string
	/**	Odoo Database : Data - Name of the Odoo database to sync with	*/
	odoo_database?: string
	/**	Authentication Method : Select - Choose authentication method for Odoo connection	*/
	odoo_auth_method?: "Username & Password" | "API Key"
	/**	Odoo Username : Data - Odoo username for XMLRPC authentication	*/
	odoo_username?: string
	/**	Odoo Password : Password - Odoo password for XMLRPC authentication	*/
	odoo_password?: string
	/**	Odoo Username : Data - Odoo username for API key authentication	*/
	odoo_api_username?: string
	/**	Odoo API Key : Password - API key for authenticating with Odoo	*/
	odoo_api_key?: string
	/**	Connection Status : Small Text - Status of last connection test	*/
	connection_status?: string
	/**	Last Connection Test : Datetime - Timestamp of last connection test	*/
	last_connection_test?: string
	/**	Sync All Odoo Users : Check - Sync ALL active users from Odoo (ignores filter settings)	*/
	sync_all_odoo_users?: 0 | 1
	/**	Enable User Filter : Check - Enable filtering of Odoo users during sync	*/
	odoo_user_filter_enabled?: 0 | 1
	/**	Filter Field : Select - Odoo field to apply filter on (name, login, or email)	*/
	odoo_user_filter_field?: "name" | "login" | "email"
	/**	Filter Value : Data - Value to search for in filter field (supports partial match)	*/
	odoo_user_filter_value?: string
	/**	Queue Processing Frequency (minutes) : Int - How often to process the transaction sync queue	*/
	sync_frequency_minutes?: number
	/**	Max Retry Attempts : Int - Maximum number of retry attempts for failed syncs	*/
	max_retry_attempts?: number
	/**	Sync Timeout (seconds) : Int - Timeout for API requests to Odoo	*/
	sync_timeout_seconds?: number
	/**	Enable Webhook Receiver : Check - Enable webhook endpoint for real-time sync from Odoo	*/
	webhook_enabled?: 0 | 1
	/**	Webhook Secret Key : Password - Secret key for validating webhook requests from Odoo	*/
	webhook_secret_key?: string
	/**	Last Successful Sync : Datetime - Timestamp of last successful sync operation	*/
	last_successful_sync?: string
	/**	Sync Statistics : Small Text - Summary of recent sync operations	*/
	sync_statistics?: string
}