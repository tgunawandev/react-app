
export interface VisitActivityTemplate{
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
	/**	Template Name : Data	*/
	template_name: string
	/**	Activity Type : Select	*/
	activity_type: "Checklist" | "Photo" | "Stock Check" | "Competitor Tracking"
	/**	Is Mandatory : Check	*/
	is_mandatory?: 0 | 1
	/**	Photo Required : Check	*/
	photo_required?: 0 | 1
	/**	Status : Select	*/
	status: "active" | "inactive"
	/**	Display Order : Int	*/
	display_order?: number
	/**	Description : Text	*/
	description?: string
	/**	Field Definitions (JSON) : Long Text - JSON array defining form fields for this activity	*/
	field_definitions?: string
	/**	Validation Rules (JSON) : Long Text - JSON validation rules for conditional logic	*/
	validation_rules?: string
}