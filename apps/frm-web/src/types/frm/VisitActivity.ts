
export interface VisitActivity{
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
	/**	Activity Template : Link - Visit Activity Template	*/
	activity_template?: string
	/**	Activity Name : Data	*/
	activity_name?: string
	/**	Activity Type : Select	*/
	activity_type: "Checklist" | "Photo" | "Stock Check" | "Competitor Tracking" | "Custom"
	/**	Sequence : Int	*/
	sequence: number
	/**	Mandatory : Check	*/
	mandatory?: 0 | 1
	/**	Status : Select	*/
	status: "pending" | "completed" | "skipped"
	/**	Completed At : Datetime	*/
	completed_at?: string
	/**	Start Time : Datetime	*/
	start_time?: string
	/**	End Time : Datetime	*/
	end_time?: string
	/**	Duration (minutes) : Float	*/
	duration_minutes?: number
	/**	Form Data (JSON) : Long Text	*/
	form_data?: string
	/**	Result (JSON) : Long Text	*/
	result?: string
	/**	Photo : Attach Image	*/
	photo?: string
	/**	Notes : Small Text	*/
	notes?: string
	/**	Outcome Notes : Text	*/
	outcome_notes?: string
}