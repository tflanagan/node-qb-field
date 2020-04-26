'use strict';

/* Dependencies */
import {
	QuickBase,
	QuickBaseOptions,
	QuickBaseResponseField,
	QuickBaseResponseDeleteFields,
	QuickBaseFieldUsage
} from 'quickbase';

/* Globals */
const VERSION = require('../package.json').version;
const IS_BROWSER = typeof(window) !== 'undefined';

/* Main Class */
export class QBField {

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
	
		dbid: (() => {
			if(IS_BROWSER){
				const dbid = window.location.pathname.match(/^\/db\/(?!main)(.*)$/);
	
				if(dbid){
					return dbid[1];
				}
			}
	
			return '';
		})(),
		fid: -1
	};

	private _qb: QuickBase;
	private _dbid: string = '';
	private _fid: number = -1;
	private _data: QBFieldData = {
		id: -1,
		fieldType: '',
		label: ''
	};
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

	constructor(options?: QBFieldOptions){
		if(options){
			if(options.quickbase instanceof QuickBase){
				this._qb = options.quickbase;
			}else{
				this._qb = new QuickBase(options.quickbase);
			}

			this.setDBID(options.dbid)
				.setFid(options.fid);
		}else{
			this._qb = new QuickBase();
		}

		return this;
	}

	/**
	 * This method clears the QBField instance of any trace of the existing field, but preserves defined connection settings.
	 */
	clear(): QBField {
		this._dbid = '';
		this._fid = -1;

		this._data = {
			id: -1,
			fieldType: '',
			label: ''
		};

		return this;
	}

	/**
	 * This method deletes the field from QuickBase, then calls `.clear()`.
	 */
	async delete(): Promise<QuickBaseResponseDeleteFields> {
		try {
			const results = await this._qb.deleteFields({
				tableId: this.get('dbid'),
				fieldIds: [
					this.get('id')
				]
			});

			this.clear();

			return results;
		}catch(err){
			// TODO: test if err is field not found or deleted, return true

			throw err;
		}
	}

	/**
	 * Get an attribute value
	 * 
	 * @param attribute Quick Base Field attribute name
	 */
	get(attribute: string): any {
		if(attribute === 'dbid'){
			return this.getDBID();
		}else
		if(attribute === 'fid' || attribute === 'id'){
			return this.getFid();
		}else
		if(attribute === 'usage'){
			return this.getUsage();
		}

		if(!this._data.hasOwnProperty(attribute)){
			return null;
		}

		return this._data[attribute];
	}

	/**
	 * Get the set QBField Table ID
	 */
	getDBID(): string {
		return this._dbid;
	}

	/**
	 * Get the set QBField Field ID
	 */
	getFid(): number {
		return this._fid;
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
	async load(): Promise<QBFieldData> {
		const results = await this._qb.getField({
			tableId: this.get('dbid'),
			fieldId: this.get('id')
		});

		this._data = results;

		return this._data;
	}

	/**
	 * Load the Quick Base Field usage
	 */
	async loadUsage(): Promise<QuickBaseFieldUsage> {
		const results = await this._qb.getFieldUsage({
			tableId: this.get('dbid'),
			fieldId: this.get('fid')
		});

		this._usage = results.usage;

		return this._usage;
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
	async save(attributesToSave?: string[]): Promise<QBFieldData> {
		const data: any = {
			tableId: this.get('dbid'),
			fieldType: this.get('fieldType'),
			label: this.get('label')
		};

		Object.keys(this._data).filter((attribute) => {
			return !attributesToSave || attributesToSave.indexOf(attribute) !== -1;
		}).forEach((attribute) => {
			data[attribute] = this.get(attribute);
		});

		let results;

		if(this.get('id') > 0){
			data.fieldId = this.get('id');

			results = await this._qb.updateField(data);
		}else{
			results = await this._qb.createField(data);
		}

		this._data = results;

		this.setFid(this._data.id);

		return this._data;
	}

	/**
	 * Sets the passed in `value` associated with the `attribute` argument.
	 * 
	 * @param attribute Quick Base Field attribute name
	 * @param value Attribute value
	 */
	set(attribute: string, value: any): QBField {
		if(attribute === 'dbid'){
			this.setDBID(value);
		}else
		if(attribute === 'fid' || attribute === 'id'){
			this.setFid(value);
		}

		this._data[attribute] = value;

		return this;
	}

	/**
	 * Sets the defined Table ID
	 * 
	 * An alias for `.set('dbid', 'xxxxxxxxx')`.
	 * 
	 * @param dbid Quick Base Field Table ID
	 */
	setDBID(dbid: string): QBField {
		this._dbid = dbid;

		return this;
	}

	/**
	 * Sets the defined Table ID
	 * 
	 * An alias for `.set('id', 'xxxxxxxxx')` and `.set('fid', 'xxxxxxxxx')`.
	 * 
	 * @param fid Quick Base Field ID
	 */
	setFid(fid: number): QBField {
		this._fid = fid;

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

		if(json.dbid){
			this.set('dbid', json.dbid);
		}

		if(json.fid || json.id){
			this.set('fid', json.fid || json.id);
		}

		if(json.data){
			this._data = json.data;
		}

		return this;
	}

	/**
	 * Serialize the QBField instance into JSON
	 */
	toJSON(): QBFieldJSON {
		return {
			quickbase: this._qb.toJSON(),
			dbid: this.get('dbid'),
			fid: this.get('fid'),
			data: this._data
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
	static newField(options: QBFieldOptions, attributes?: QBFieldData): QBField {
		const newField = new QBField(options);

		if(attributes){
			Object.keys(attributes).forEach((attribute) => {
				newField.set(attribute, attributes[attribute]);
			});
		}
	
		return newField;
	};

}

/* Interfaces */
export interface QBFieldSettings {
	dbid: string;
	fid: number;
}

export interface QBFieldOptions extends QBFieldSettings {
	quickbase?: QuickBaseOptions | QuickBase;
}

export interface QBFieldData extends QuickBaseResponseField {
	[index: string]: any;
}

export interface QBFieldJSON extends QBFieldOptions {
	quickbase?: QuickBaseOptions;
	dbid: string;
	fid: number;
	id?: number;
	data?: QBFieldData;
}

/* Export to Browser */
if(IS_BROWSER){
	// @ts-ignore
	window.QBField = QBField;
}
