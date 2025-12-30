
export interface DeliveryAssignment{
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
	/**	Driver : Link - User	*/
	driver: string
	/**	Driver Name : Data	*/
	driver_name?: string
	/**	Driver Phone : Data	*/
	driver_phone?: string
	/**	Assignment Type : Select	*/
	assignment_type?: "original" | "handoff" | "reassign"
	/**	Status : Select	*/
	status?: "pending" | "accepted" | "rejected" | "in_progress" | "completed" | "cancelled"
	/**	Sequence Number : Int - Order in route sequence	*/
	sequence_number?: number
	/**	Assigned At : Datetime	*/
	assignment_timestamp?: string
	/**	Assigned By : Link - User	*/
	assigned_by?: string
	/**	Accepted/Rejected At : Datetime	*/
	acceptance_timestamp?: string
	/**	Rejection Reason : Small Text	*/
	rejection_reason?: string
	/**	Pickup Location : Link - Warehouse	*/
	pickup_location?: string
	/**	Delivery Location : Text - Customer delivery address	*/
	delivery_location?: string
	/**	Estimated Arrival : Datetime	*/
	estimated_arrival_time?: string
	/**	Actual Arrival : Datetime	*/
	actual_arrival_time?: string
	/**	Handoff From : Link - Delivery Assignment - Previous assignment in chain of custody	*/
	handoff_from_assignment?: string
	/**	Handoff Hub : Link - Delivery Transit Hub - Transit hub where handoff occurred	*/
	handoff_to_hub?: string
	/**	Handoff Notes : Text	*/
	handoff_notes?: string
	/**	Handoff Timestamp : Datetime	*/
	handoff_timestamp?: string
	/**	Handoff GPS Latitude : Float	*/
	handoff_gps_latitude?: number
	/**	Handoff GPS Longitude : Float	*/
	handoff_gps_longitude?: number
	/**	GPS Latitude : Float	*/
	gps_latitude_assigned?: number
	/**	GPS Longitude : Float	*/
	gps_longitude_assigned?: number
	/**	GPS Accuracy (m) : Float	*/
	gps_accuracy_assigned?: number
}