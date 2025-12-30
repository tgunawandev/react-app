import { CompetitorSurveyItem } from './CompetitorSurveyItem'

export interface CompetitorSurvey{
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
	/**	Series : Select	*/
	naming_series: "CS-.YYYY.-"
	/**	Sales Visit : Link - Sales Visit	*/
	sales_visit?: string
	/**	Customer : Link - Customer	*/
	customer: string
	/**	Customer Name : Data	*/
	customer_name?: string
	/**	Survey Date : Date	*/
	survey_date: string
	/**	Status : Select	*/
	status?: "Draft" | "Submitted"
	/**	Items : Table - Competitor Survey Item	*/
	items: CompetitorSurveyItem[]
	/**	Total Products : Int	*/
	total_products?: number
	/**	Notes : Text	*/
	notes?: string
}