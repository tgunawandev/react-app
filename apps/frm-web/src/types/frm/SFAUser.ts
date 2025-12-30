
export interface SFAUser{
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
	/**	User : Link - User	*/
	user: string
	/**	User Name : Data	*/
	user_name?: string
	/**	Active : Check	*/
	active?: 0 | 1
	/**	SFA Role : Select	*/
	sfa_role: "Sales Rep" | "Delivery Driver" | "Hub Driver" | "Sales Admin" | "Delivery Admin"
	/**	Operating Unit : Link - Operating Unit	*/
	operating_unit?: string
	/**	Sales Team : Link - Sales Team	*/
	sales_team?: string
	/**	Default Warehouse : Link - Warehouse - Default warehouse for this user	*/
	default_warehouse?: string
	/**	Vehicle : Data - Vehicle assigned to this driver	*/
	vehicle?: string
	/**	Assigned Master Routes : Small Text - Master routes assigned to this user (comma-separated names)	*/
	assigned_master_routes?: string
	/**	Mobile Number : Data	*/
	mobile_number?: string
	/**	WhatsApp Number : Data	*/
	whatsapp_number?: string
	/**	Emergency Contact : Data	*/
	emergency_contact?: string
	/**	Notes : Small Text	*/
	notes?: string
}