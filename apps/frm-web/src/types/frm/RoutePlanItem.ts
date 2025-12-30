
export interface RoutePlanItem{
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
	/**	Customer : Link - Customer	*/
	customer: string
	/**	Sequence : Int	*/
	sequence: number
	/**	Visit Status : Select	*/
	visit_status: "Pending" | "Completed" | "Skipped"
	/**	Estimated Arrival Time : Time	*/
	estimated_arrival_time?: string
	/**	Actual Check-In Time : Datetime	*/
	actual_check_in_time?: string
	/**	Distance from Previous (km) : Float	*/
	distance_from_previous_km?: number
	/**	Sales Visit : Link - Sales Visit	*/
	sales_visit?: string
	/**	Skip Reason : Select	*/
	skip_reason?: "Customer Closed" | "Out of Stock" | "Customer Refused" | "Time Constraint" | "Other"
	/**	Skip Notes : Small Text	*/
	skip_notes?: string
}