
export interface RouteStop{
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
	/**	Sequence : Int	*/
	sequence: number
	/**	Stop Type : Select	*/
	stop_type: "Sales Visit" | "Delivery" | "Stock Transfer" | "Pickup" | "Break"
	/**	Stop Name : Data	*/
	stop_name?: string
	/**	Status : Select	*/
	status?: "pending" | "arrived" | "in_progress" | "completed" | "skipped" | "partial" | "failed"
	/**	Customer : Link - Customer	*/
	customer?: string
	/**	Customer Name : Data	*/
	customer_name?: string
	/**	Warehouse : Link - Warehouse	*/
	warehouse?: string
	/**	Location Name : Data	*/
	location_name?: string
	/**	Latitude : Float	*/
	latitude?: number
	/**	Longitude : Float	*/
	longitude?: number
	/**	Linked DocType : Select	*/
	linked_doctype?: "" | "Sales Visit" | "Delivery Order" | "Stock Transfer"
	/**	Linked Document : Dynamic Link	*/
	linked_document?: string
	/**	Delivery Order : Link - Delivery Order	*/
	delivery_order?: string
	/**	Sales Visit : Link - Sales Visit	*/
	sales_visit?: string
	/**	Stock Transfer : Link - Stock Transfer	*/
	stock_transfer?: string
	/**	Estimated Arrival : Time	*/
	estimated_arrival?: string
	/**	Actual Arrival : Datetime	*/
	actual_arrival?: string
	/**	Departure Time : Datetime	*/
	departure_time?: string
	/**	Duration (Minutes) : Int	*/
	duration_minutes?: number
	/**	Arrival Latitude : Float	*/
	arrival_latitude?: number
	/**	Arrival Longitude : Float	*/
	arrival_longitude?: number
	/**	Arrival Accuracy (m) : Float	*/
	arrival_accuracy?: number
	/**	Distance from Previous (km) : Float	*/
	distance_from_previous_km?: number
	/**	POD Captured : Check	*/
	pod_captured?: 0 | 1
	/**	POD Reference : Link - Delivery POD	*/
	pod_reference?: string
	/**	POD Photo : Attach Image	*/
	pod_photo?: string
	/**	POD Notes : Small Text	*/
	pod_notes?: string
	/**	Receiver Name : Data	*/
	pod_receiver?: string
	/**	Skip Reason : Select	*/
	skip_reason?: "" | "Customer Closed" | "Out of Stock" | "Customer Refused" | "Time Constraint" | "Other"
	/**	Skip Notes : Small Text	*/
	skip_notes?: string
}