
export interface DeliveryGPSLog{
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
	/**	Delivery Order : Link - Delivery Order	*/
	delivery_order: string
	/**	Delivery Assignment : Link - Delivery Assignment	*/
	delivery_assignment?: string
	/**	Driver : Link - User	*/
	driver: string
	/**	Timestamp : Datetime	*/
	timestamp: string
	/**	Event Type : Select	*/
	event_type?: "tracking" | "geofence_enter" | "geofence_exit" | "stopped" | "moving" | "started" | "ended"
	/**	Latitude : Float	*/
	gps_latitude: number
	/**	Longitude : Float	*/
	gps_longitude: number
	/**	Accuracy (m) : Float - GPS accuracy in meters	*/
	gps_accuracy?: number
	/**	Speed (km/h) : Float - Speed in km/h	*/
	speed?: number
	/**	Bearing : Float - Direction in degrees (0-360)	*/
	bearing?: number
	/**	Battery Level (%) : Int - Battery level percentage	*/
	battery_level?: number
}