'use strict';

/* Dependencies */
import merge from 'deepmerge';
import RFC4122 from 'rfc4122';
import {
	QuickBase,
	QuickBaseOptions,
	QuickBaseResponseField,
	QuickBaseResponseDeleteFields,
	QuickBaseFieldUsage,
	QuickBaseResponseFieldPermission,
	fieldType
} from 'quickbase';

/* Globals */
const VERSION = require('../package.json').version;
const IS_BROWSER = typeof(window) !== 'undefined';
const rfc4122 = new RFC4122();

/* Main Class */
export class QBField {

	/**
	 * The class name
	 *
	 * Loading multiple instances of this class results in failed `instanceof` checks.
	 * `Function.name` is corrupted by the browserify/minify processes.
	 * Allow code to check if an object is this class by look at this `CLASS_NAME`
	 * property. Code can further check `VERSION` to ensure correct versioning
	 */
	public readonly CLASS_NAME = 'QBField';
	static readonly CLASS_NAME = 'QBField';

	/**
	 * The loaded library version
	 */
	static readonly VERSION: string = VERSION;

	/**
	 * The default settings of a `QuickBase` instance
	 */
	static defaults: QBFieldOptions = {
		quickbase: {
			realm: IS_BROWSER ? window.location.host.split('.')[0] : ''
		},

		tableId: (() => {
			if(IS_BROWSER){
				const tableId = window.location.pathname.match(/^\/db\/(?!main)(.*)$/);

				if(tableId){
					return tableId[1];
				}
			}

			return '';
		})(),
		fid: -1
	};

	/**
	 * An internal id (guid) used for tracking/managing object instances
	 */
	public id: string;

	private _qb: QuickBase;
	private _tableId: string = '';
	private _fid: number = -1;
	private _data: Partial<QuickBaseResponseField> = {};
	private _usage: QuickBaseFieldUsage = {
		actions: {
			count: 0
		},
		appHomePages: {
			count: 0
		},
		defaultReports: {
			count: 0
		},
		exactForms: {
			count: 0
		},
		fields: {
			count: 0
		},
		forms: {
			count: 0
		},
		notifications: {
			count: 0
		},
		personalReports: {
			count: 0
		},
		relationships: {
			count: 0
		},
		reminders: {
			count: 0
		},
		reports: {
			count: 0
		},
		roles: {
			count: 0
		},
		webhooks: {
			count: 0
		}
	};

	constructor(options?: Partial<QBFieldOptions>){
		this.id = rfc4122.v4();

		if(options){
			const {
				quickbase,
				...classOptions
			} = options || {};

			if(quickbase){
				// @ts-ignore
				if(quickbase && quickbase.CLASS_NAME === 'QuickBase'){
					this._qb = quickbase as QuickBase;
				}else{
					this._qb = new QuickBase(quickbase as QuickBaseOptions);
				}
			}else{
				this._qb = new QuickBase();
			}

			const settings = merge(QBField.defaults, classOptions);

			this.setTableId(settings.tableId)
				.setFid(settings.fid);
		}else{
			this._qb = new QuickBase();
		}

		return this;
	}

	/**
	 * This method clears the QBField instance of any trace of the existing field, but preserves defined connection settings.
	 */
	clear(): QBField {
		this._fid = -1;
		this._data = {};

		return this;
	}

	/**
	 * This method deletes the field from QuickBase, then calls `.clear()`.
	 */
	async delete(): Promise<QuickBaseResponseDeleteFields> {
		const fid = this.get('id');

		try {
			const results = await this._qb.deleteFields({
				tableId: this.get('tableId'),
				fieldIds: [ fid ]
			});

			this.clear();

			return results;
		}catch(err: any){
			if(err.description === `Field: ${fid} was not found.`){
				this.clear();

				return {
					deletedFieldIds: [ fid ],
					errors: []
				};
			}

			throw err;
		}
	}

	/**
	 * Get an attribute value
	 *
	 * @param attribute Quick Base Field attribute name
	 */
	get(attribute: 'noWrap'): boolean;
	get(attribute: 'bold'): boolean;
	get(attribute: 'required'): boolean;
	get(attribute: 'appearsByDefault'): boolean;
	get(attribute: 'addToForms'): boolean;
	get(attribute: 'findEnabled'): boolean;
	get(attribute: 'unique'): boolean;
	get(attribute: 'doesDataCopy'): boolean;
	get(attribute: 'audited'): boolean;
	get(attribute: 'id'): number;
	get(attribute: 'fid'): number;
	get(attribute: 'tableId'): string;
	get(attribute: 'label'): string;
	get(attribute: 'mode'): string;
	get(attribute: 'fieldHelp'): string;
	get(attribute: 'fieldType'): fieldType;
	get(attribute: 'type'): fieldType;
	get(attribute: 'properties'): QuickBaseResponseField['properties'];
	get(attribute: 'permissions'): QuickBaseResponseFieldPermission[];
	get(attribute: 'usage'): QuickBaseFieldUsage;
	get(attribute: QBFieldAttribute): fieldType | QuickBaseResponseFieldPermission[] | QuickBaseFieldUsage | QuickBaseResponseField['properties'] | string | number | boolean | undefined;
	get(attribute: string): any;
	get(attribute: string): any {
		if(attribute === 'type'){
			attribute = 'fieldType';
		}

		if(attribute === 'tableId'){
			return this.getTableId();
		}else
		if(attribute === 'fid' || attribute === 'id'){
			return this.getFid();
		}else
		if(attribute === 'usage'){
			return this.getUsage();
		}

		return (this._data as Indexable)[attribute];
	}

	/**
	 * Get the set QBField Field ID
	 */
	getFid(): number {
		return this._fid;
	}

	/**
	 * Get the set QBField Table ID
	 */
	getTableId(): string {
		return this._tableId;
	}

	/**
	 * Get the Quick Base Field usage
	 *
	 * `.loadUsage()` must be called first
	 */
	getUsage(): QuickBaseFieldUsage {
		return this._usage;
	}

	/**
	 * Load the Quick Base Field attributes and permissions
	 */
	async load(): Promise<QuickBaseResponseField> {
		const results = await this._qb.getField({
			tableId: this.get('tableId'),
			fieldId: this.get('id')
		});

		getObjectKeys(results).forEach((attribute) => {
			this.set(attribute, results[attribute]);
		});

		return this._data as QuickBaseResponseField;
	}

	/**
	 * Load the Quick Base Field usage
	 */
	async loadUsage(): Promise<QuickBaseFieldUsage> {
		const results = await this._qb.getFieldUsage({
			tableId: this.get('tableId'),
			fieldId: this.get('fid')
		});

		this.set('usage', results);

		return this.get('usage');
	}

	/**
	 * If a field id is not defined, this will execute the createField option. After a successful
	 * createField, or if a field id was previously defined, this will execute an updateField.
	 *
	 * If `attributesToSave` is defined, then only configured attributes in this array will be saved.
	 *
	 * If this executes a createField, the newly assigned Field ID is automatically stored internally.
	 *
	 * After a successful save, all new attributes are available for use.
	 *
	 * @param attributesToSave Array of attributes to save
	 */
	async save(attributesToSave?: QBFieldAttributeSavable[]): Promise<QuickBaseResponseField> {
		const data: any = {
			tableId: this.get('tableId'),
			label: this.get('label')
		};

		const saveable: QBFieldAttributeSavable[] = [
			'fieldHelp',
			'permissions',
			'label',
			'noWrap',
			'bold',
			'appearsByDefault',
			'findEnabled',
			'addToForms'
		];

		if(this.get('id') > 0){
			saveable.push(
				'required',
				'unique'
			);
		}else{
			saveable.push(
				'fieldType',
				'mode',
				'audited',
			);
		}

		// TODO
		// Need to filter out properties based on field type
		// Field schema is not "round-trip", the returned schema
		// has attributes in the properties object that are not
		// accepted when saved. For now, only save the properties
		// object when requested.
		if(attributesToSave?.indexOf('properties')){
			saveable.push('properties');
		}

		saveable.filter((attribute) => {
			return !attributesToSave || attributesToSave.indexOf(attribute) !== -1;
		}).forEach((attribute) => {
			data[attribute] = this.get(attribute);
		});

		let results: Record<string, any>;

		if(this.get('id') > 0){
			data.fieldId = this.get('id');

			results = await this._qb.updateField(data);
		}else{
			results = await this._qb.createField(data);
		}

		getObjectKeys(results).forEach((attribute) => {
			this.set(attribute, results[attribute]);
		});

		return this._data as QuickBaseResponseField;
	}

	/**
	 * Sets the passed in `value` associated with the `attribute` argument.
	 *
	 * @param attribute Quick Base Field attribute name
	 * @param value Attribute value
	 */
	set(attribute: 'noWrap', value: boolean): QBField;
	set(attribute: 'bold', value: boolean): QBField;
	set(attribute: 'required', value: boolean): QBField;
	set(attribute: 'appearsByDefault', value: boolean): QBField;
	set(attribute: 'addToForms', value: boolean): QBField;
	set(attribute: 'findEnabled', value: boolean): QBField;
	set(attribute: 'unique', value: boolean): QBField;
	set(attribute: 'doesDataCopy', value: boolean): QBField;
	set(attribute: 'audited', value: boolean): QBField;
	set(attribute: 'id', value: number): QBField;
	set(attribute: 'fid', value: number): QBField;
	set(attribute: 'tableId', value: string): QBField;
	set(attribute: 'label', value: string): QBField;
	set(attribute: 'mode', value: string): QBField;
	set(attribute: 'fieldHelp', value: string): QBField;
	set(attribute: 'fieldType', value: fieldType): QBField;
	set(attribute: 'type', value: fieldType): QBField;
	set(attribute: 'properties', value: QuickBaseResponseField['properties']): QBField;
	set(attribute: 'permissions', value: QuickBaseResponseField['permissions']): QBField;
	set(attribute: QBFieldAttribute, value: any): QBField;
	set(attribute: string, value: any): QBField;
	set(attribute: string, value: any): QBField {
		if(attribute === 'tableId'){
			this.setTableId(value);
		}else
		if(attribute === 'fid' || attribute === 'id'){
			this.setFid(value);
		}

		(this._data as Indexable)[attribute] = value;

		return this;
	}

	/**
	 * Sets the defined Field ID
	 *
	 * An alias for `.set('id', 6)` and `.set('fid', 6)`.
	 *
	 * @param fid Quick Base Field ID
	 */
	setFid(fid: number): QBField {
		this._fid = fid;

		return this;
	}

	/**
	 * Sets the defined Table ID
	 *
	 * An alias for `.set('tableId', 'xxxxxxxxx')`.
	 *
	 * @param tableId Quick Base Field Table ID
	 */
	setTableId(tableId: string): QBField {
		this._tableId = tableId;

		return this;
	}

	/**
	 * Rebuild the QBField instance from serialized JSON
	 *
	 * @param json QBField serialized JSON
	 */
	fromJSON(json: string | QBFieldJSON): QBField {
		if(typeof(json) === 'string'){
			json = JSON.parse(json);
		}

		if(typeof(json) !== 'object'){
			throw new TypeError('json argument must be type of object or a valid JSON string');
		}

		if(json.quickbase){
			this._qb = new QuickBase(json.quickbase);
		}

		if(json.tableId){
			this.set('tableId', json.tableId);
		}

		if(json.fid || json.id){
			this.set('fid', json.fid || json.id || -1);
		}

		if(json.data){
			getObjectKeys(json.data).forEach((name) => {
				this.set(name, (json as QBFieldJSON).data![name]);
			});
		}

		if(json.usage){
			this._usage = json.usage;
		}

		return this;
	}

	/**
	 * Serialize the QBField instance into JSON
	 */
	toJSON(): QBFieldJSON {
		return {
			quickbase: this._qb.toJSON(),
			tableId: this.get('tableId'),
			fid: this.get('fid'),
			data: merge({}, this._data),
			usage: this.getUsage()
		};
	}

	/**
	 * Create a new QBField instance from serialized JSON
	 *
	 * @param json QBField serialized JSON
	 */
	static fromJSON(json: string | QBFieldJSON): QBField {
		if(typeof(json) === 'string'){
			json = JSON.parse(json);
		}

		if(typeof(json) !== 'object'){
			throw new TypeError('json argument must be type of object or a valid JSON string');
		}

		const newField = new QBField();

		return newField.fromJSON(json);
	}

	/**
	 * Returns a new QBField instance built off of `options`, that inherits configuration data from the passed in `attributes` argument.
	 *
	 * @param options QBField instance options
	 * @param attributes Quick Base Field attribute data
	 */
	static newField(options: Partial<QBFieldOptions>, attributes?: QuickBaseResponseField): QBField {
		const newField = new QBField(options);

		if(attributes){
			getObjectKeys(attributes).forEach((attribute) => {
				newField.set(attribute, attributes[attribute]);
			});
		}

		return newField;
	};

}

/* Helpers */
function getObjectKeys<O>(obj: O): (keyof O)[] {
    return Object.keys(obj) as (keyof O)[];
}

/* Interfaces */
export type QBFieldAttribute = keyof QuickBaseResponseField | 'type' | 'fid' | 'usage' | 'id';
export type QBFieldAttributeSavable = Exclude<QBFieldAttribute, 'usage' | 'type' | 'doesDataCopy' | 'fid'>;

interface Indexable {
	[index: string]: any;
}

export interface QBFieldOptions {
	quickbase: QuickBaseOptions | QuickBase;
	tableId: string;
	fid: number;
}

export interface QBFieldJSON {
	quickbase?: QuickBaseOptions;
	tableId: string;
	fid: number;
	id?: number;
	data?: QuickBaseResponseField;
	usage?: QuickBaseFieldUsage;
}

/* Export to Browser */
if(IS_BROWSER){
	// @ts-ignore
	window.QBField = QBField;
}
