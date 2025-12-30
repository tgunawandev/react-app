
export interface DeliveryTransitHub{
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
	/**	Hub Name : Data	*/
	hub_name: string
	/**	Hub Code : Data	*/
	hub_code: string
	/**	Hub Type : Select	*/
	hub_type?: "warehouse" | "cross_dock" | "transit_point"
	/**	Active : Check	*/
	active?: 0 | 1
	/**	Operating Unit : Link - Operating Unit	*/
	operating_unit?: string
	/**	Warehouse : Link - Warehouse - Link to Frappe Warehouse if this hub is a warehouse	*/
	warehouse?: string
	/**	Address : Text	*/
	address?: string
	/**	City : Data	*/
	city?: string
	/**	State/Province : Data	*/
	state?: string
	/**	GPS Latitude : Float	*/
	gps_latitude?: number
	/**	GPS Longitude : Float	*/
	gps_longitude?: number
	/**	Geofence Radius (m) : Int - Geofence radius in meters for detecting arrivals	*/
	geofence_radius?: number
	/**	Opens At : Time	*/
	operating_hours_start?: string
	/**	Closes At : Time	*/
	operating_hours_end?: string
	/**	Contact Person : Data	*/
	contact_person?: string
	/**	Contact Phone : Data	*/
	contact_phone?: string
}