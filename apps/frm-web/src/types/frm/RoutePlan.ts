import { RoutePlanItem } from './RoutePlanItem'

export interface RoutePlan{
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
	/**	Plan Date : Date	*/
	plan_date: string
	/**	Sales Representative : Link - User	*/
	sales_representative: string
	/**	Status : Select	*/
	status: "Draft" | "Confirmed" | "In Progress" | "Completed" | "Cancelled"
	/**	Optimization Algorithm : Data	*/
	optimization_algorithm?: string
	/**	Customers : Table - Route Plan Item	*/
	customers: RoutePlanItem[]
	/**	Visits Planned : Int	*/
	visits_planned?: number
	/**	Visits Completed : Int	*/
	visits_completed?: number
	/**	Completion % : Percent	*/
	completion_percentage?: number
	/**	Total Distance (km) : Float	*/
	total_distance_km?: number
	/**	Estimated Duration (hours) : Float	*/
	estimated_duration_hours?: number
	/**	Actual Distance (km) : Float	*/
	actual_distance_km?: number
}