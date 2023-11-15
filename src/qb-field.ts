'use strict';

/* Dependencies */
import merge from 'deepmerge';
import RFC4122 from 'rfc4122';
import {
	QuickBase,
	QuickBaseError,
	QuickBaseOptions,
	QuickBaseRequest,
	QuickBaseResponseCreateField,
	QuickBaseResponseDeleteFields,
	QuickBaseResponseGetField,
	QuickBaseResponseGetFieldUsage,
	QuickBaseResponseUpdateField
} from 'quickbase';

/* Globals */
const VERSION = require('../package.json').version;
const IS_BROWSER = typeof(window) !== 'undefined';
const rfc4122 = new RFC4122();

const BASE_USAGE = {
	actions: {
		count: 0
	},
	appHomePages: {
		count: 0
	},
	dashboards: {
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
	tableImports: {
		count: 0
	},
	tableRules: {
		count: 0
	},
	webhooks: {
		count: 0
	}
};

/* Main Class */
export class QBField<CustomGetSet extends Object = Record<any, any>> {

	public readonly CLASS_NAME = 'QBField';
	static readonly CLASS_NAME = 'QBField';

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
	private _data: Record<any, any> = {};
	private _usage: QuickBaseResponseGetFieldUsage[0]['usage'] = merge({}, BASE_USAGE);

	constructor(options?: Partial<QBFieldOptions>){
		this.id = rfc4122.v4();

		const {
			quickbase,
			...classOptions
		} = options || {};

		if(QuickBase.IsQuickBase(quickbase)){
			this._qb = quickbase;
		}else{
			this._qb = new QuickBase(merge.all([
				QBField.defaults.quickbase,
				quickbase || {}
			]));
		}

		const settings = merge(QBField.defaults, classOptions);

		this.setTableId(settings.tableId)
			.setFid(settings.fid);

		return this;
	}

	/**
	 * This method clears the QBField instance of any trace of the existing field, but preserves defined connection settings.
	 */
	clear(): this {
		this._fid = -1;
		this._data = {};
		this._usage = merge({}, BASE_USAGE);

		return this;
	}

	/**
	 * This method deletes the field from QuickBase, then calls `.clear()`.
	 */
	async delete({ requestOptions }: QuickBaseRequest = {}): Promise<QuickBaseResponseDeleteFields> {
		const fid = this.get('id');
		const fin = (deletedFieldIds: number[]) => {
			this.clear();

			return {
				deletedFieldIds,
				errors: []
			};
		}

		if(!fid){
			return fin([ fid ]);
		}

		try {
			const {
				headers,
				data
			} = await this._qb.deleteFields({
				tableId: this.getTableId(),
				fieldIds: [ fid ],
				returnAxios: true,
				requestOptions
			});

			if(data.errors && data.errors.length > 0){
				throw new QuickBaseError(1000, 'Unable to delete field', data.errors[0], headers['qb-api-ray']);
			}

			this.clear();

			return data;
		}catch(err: any){
			if(err.description === `Field: ${fid} was not found.`){
				return fin([ fid ]);
			}

			throw err;
		}
	}

	/**
	 * Get an attribute value
	 *
	 * @param attribute Quick Base Field attribute name
	 */
	get(attribute: 'tableId'): string;
	get(attribute: 'fid'): number;
	get(attribute: 'id'): number;
	get(attribute: 'type'): string;
	get(attribute: 'addToForms'): boolean;
	get(attribute: 'usage'): QuickBaseResponseGetFieldUsage[0]['usage'];
	get<P extends keyof QuickBaseResponseGetField>(prop: P): QuickBaseResponseGetField[P];
	get<P extends keyof CustomGetSet>(prop: P): CustomGetSet[P];
	get<P extends string>(prop: P): P extends keyof QuickBaseResponseGetField ? QuickBaseResponseGetField[P] : (P extends keyof CustomGetSet ? CustomGetSet[P] : any);
	get(attribute: any): any {
		if(attribute === 'tableId'){
			return this.getTableId();
		}else
		if(attribute === 'fid' || attribute === 'id'){
			return this.getFid();
		}else
		if(attribute === 'usage'){
			return this.getUsage();
		}

		if(attribute === 'type'){
			attribute = 'fieldType';
		}

		return this._data[attribute];
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

	async getTempToken({ requestOptions }: QuickBaseRequest = {}): Promise<void> {
		await this._qb.getTempTokenDBID({
			dbid: this.getTableId(),
			requestOptions
		});
	}

	/**
	 * Get the Quick Base Field usage
	 *
	 * `.loadUsage()` must be called first
	 */
	getUsage(): QuickBaseResponseGetFieldUsage[0]['usage'] {
		return this._usage;
	}

	/**
	 * Load the Quick Base Field attributes and permissions
	 */
	async load({ requestOptions }: QuickBaseRequest = {}): Promise<QuickBaseResponseGetField> {
		const results = await this._qb.getField({
			tableId: this.getTableId(),
			fieldId: this.getFid(),
			requestOptions
		});

		Object.entries(results).forEach(([ attribute, value ]) => {
			this.set(attribute as keyof QuickBaseResponseGetField, value);
		});

		return this._data as QuickBaseResponseGetField;
	}

	/**
	 * Load the Quick Base Field usage
	 */
	async loadUsage({ requestOptions }: QuickBaseRequest = {}): Promise<QuickBaseResponseGetFieldUsage[0]['usage']> {
		const results = await this._qb.getFieldUsage({
			tableId: this.getTableId(),
			fieldId: this.getFid(),
			requestOptions
		});

		this.set('usage', results[0].usage);

		return this.getUsage();
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
	async save({
		attributesToSave,
		requestOptions
	}: QuickBaseRequest & {
		attributesToSave?: QBFieldAttributeSavable[];
	} = {}): Promise<QuickBaseResponseGetField> {
		const data: any = {
			tableId: this.getTableId(),
			label: this.get('label'),
			requestOptions
		};

		const saveable: QBFieldAttributeSavable[] = [
			'fieldHelp',
			'permissions',
			'label',
			'noWrap',
			'bold',
			'appearsByDefault',
			'findEnabled'
		];

		if(this.getFid() > 0){
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

		let results: QuickBaseResponseCreateField | QuickBaseResponseUpdateField;

		if(this.getFid() > 0){
			data.fieldId = this.getFid();

			results = await this._qb.updateField(data);
		}else{
			results = await this._qb.createField(data);
		}

		Object.entries(results).forEach(([ attribute, val ]) => {
			this.set(attribute as keyof QuickBaseResponseUpdateField, val);
		});

		return this._data as QuickBaseResponseUpdateField;
	}

	/**
	 * Sets the passed in `value` associated with the `attribute` argument.
	 *
	 * @param attribute Quick Base Field attribute name
	 * @param value Attribute value
	 */
	set(attribute: 'tableId', value: string): this;
	set(attribute: 'fid', value: number): this;
	set(attribute: 'id', value: number): this;
	set(attribute: 'type', value: string): this;
	set(attribute: 'addToForms', value: boolean): this;
	set(attribute: 'usage', value: QuickBaseResponseGetFieldUsage[0]['usage']): this;
	set<P extends keyof QuickBaseResponseGetField>(prop: P, value: QuickBaseResponseGetField[P]): void;
	set<P extends keyof CustomGetSet>(prop: P, value: CustomGetSet[P]): void;
	set<P extends string>(prop: P, value: P extends keyof QuickBaseResponseGetField ? QuickBaseResponseGetField[P] : (P extends keyof CustomGetSet ? CustomGetSet[P] : any)): void;
	set(attribute: string, value: any): this {
		if(attribute === 'tableId'){
			return this.setTableId(value);
		}else
		if(attribute === 'fid' || attribute === 'id'){
			return this.setFid(value);
		}else
		if(attribute === 'usage'){
			this._usage = value;
		}else{
			if(attribute === 'type'){
				attribute = 'fieldType';
			}

			this._data[attribute] = value;
		}

		return this;
	}

	/**
	 * Sets the defined Field ID
	 *
	 * An alias for `.set('id', 6)` and `.set('fid', 6)`.
	 *
	 * @param fid Quick Base Field ID
	 */
	setFid(fid: number): this {
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
	setTableId(tableId: string): this {
		this._tableId = tableId;

		return this;
	}

	/**
	 * Rebuild the QBField instance from serialized JSON
	 *
	 * @param json QBField serialized JSON
	 */
	fromJSON(json: string | QBFieldJSON): this {
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
			this.setTableId(json.tableId);
		}

		if(json.fid || json.id){
			this.setFid(json.fid || json.id || -1);
		}

		if(json.data){
			Object.entries(json.data).forEach(([ key, value ]) => {
				this.set(key as keyof QuickBaseResponseGetField, value);
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
			tableId: this.getTableId(),
			fid: this.getFid(),
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
	 * Test if a variable is a `qb-field` object
	 *
	 * @param obj A variable you'd like to test
	 */
	static IsQBField(obj: any): obj is QBField {
		return ((obj || {}) as QBField).CLASS_NAME === QBField.CLASS_NAME;
	}

	/**
	 * Returns a new QBField instance built off of `options`, that inherits configuration data from the passed in `attributes` argument.
	 *
	 * @param options QBField instance options
	 * @param attributes Quick Base Field attribute data
	 */
	static NewField(options: Partial<QBFieldOptions>, attributes?: Partial<QuickBaseResponseGetField> & Record<any, any>): QBField {
		const newField = new QBField(options);

		if(attributes){
			Object.entries(attributes).forEach(([ attribute, value ]) => {
				newField.set(attribute, value);
			});
		}

		return newField;
	}

}

/* Types */
export type QBFieldAttribute = keyof QuickBaseResponseGetField;
export type QBFieldAttributeSavable = Exclude<QBFieldAttribute, 'usage' | 'type' | 'doesDataCopy' | 'fid'>;

export type QBFieldOptions = {
	quickbase: QuickBaseOptions | QuickBase;
	tableId: string;
	fid: number;
}

export type QBFieldJSON = {
	quickbase?: QuickBaseOptions;
	tableId: string;
	fid: number;
	id?: number;
	data?: Partial<QuickBaseResponseGetField> & Record<any, any>;
	usage?: QuickBaseResponseGetFieldUsage[0]['usage'];
}

/* Export to Browser */
if(IS_BROWSER){
	window.QBField = exports;
}
