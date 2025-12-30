import { VisitActivity } from './VisitActivity'

export interface SalesVisit{
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
	/**	Naming Series : Select	*/
	naming_series: "SV-.YYYY.-"
	/**	Visit Date : Date	*/
	visit_date: string
	/**	Sales Representative : Link - User	*/
	sales_rep: string
	/**	Customer : Link - Customer	*/
	customer: string
	/**	Operating Unit : Link - Operating Unit	*/
	operating_unit?: string
	/**	Route : Link - Route	*/
	route?: string
	/**	Route Stop Index : Int - Index of the route stop this visit is linked to	*/
	route_stop_idx?: number
	/**	Status : Select	*/
	status: "planned" | "in_progress" | "completed" | "cancelled"
	/**	Check In Time : Datetime	*/
	check_in_time?: string
	/**	Check In GPS Latitude : Float	*/
	check_in_gps_lat?: number
	/**	Check In GPS Longitude : Float	*/
	check_in_gps_long?: number
	/**	Check In GPS Accuracy (meters) : Float	*/
	check_in_gps_accuracy?: number
	/**	Distance to Customer (meters) : Float	*/
	distance_to_customer?: number
	/**	Check In Photo : Attach Image	*/
	check_in_photo?: string
	/**	QR Code Scanned : Data	*/
	qr_code_scanned?: string
	/**	QR Validation Status : Select	*/
	qr_validation_status?: "Valid" | "Invalid" | "Not Scanned"
	/**	Check Out Time : Datetime	*/
	check_out_time?: string
	/**	Check Out GPS Latitude : Float	*/
	check_out_gps_lat?: number
	/**	Check Out GPS Longitude : Float	*/
	check_out_gps_long?: number
	/**	Check Out Photo : Attach Image	*/
	check_out_photo?: string
	/**	Visit Outcome : Select	*/
	visit_outcome?: "Order Placed" | "No Order" | "Revisit Required"
	/**	No Order Reason : Small Text	*/
	no_order_reason?: string
	/**	Activities : Table - Visit Activity	*/
	activities?: VisitActivity[]
	/**	Total Activities : Int	*/
	total_activities?: number
	/**	Activities Completed : Int	*/
	activities_completed?: number
	/**	Completion % : Percent	*/
	activity_completion_percent?: number
	/**	Order Created : Check	*/
	order_created?: 0 | 1
	/**	Order Reference : Link - Sales Order	*/
	order_reference?: string
	/**	Order Value : Currency	*/
	order_value?: number
	/**	Visit Duration (minutes) : Int	*/
	visit_duration?: number
	/**	Notes : Text	*/
	notes?: string
}