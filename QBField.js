'use strict';

/* Versioning */
const VERSION_MAJOR = 0;
const VERSION_MINOR = 1;
const VERSION_PATCH = 0;

/* Dependencies */
const merge = require('lodash.merge');
const QuickBase = require('quickbase');

/* Default Settings */
const defaults = {
	quickbase: {
		realm: (typeof global !== 'undefined' && typeof window !== 'undefined' && global === window) || (typeof global === 'undefined' && typeof window !== 'undefined') ? global.location.host.split('.')[0] : '',
		appToken: ''
	},

	dbid: (function(){
		if((typeof global !== 'undefined' && typeof window !== 'undefined' && global === window) || (typeof global === 'undefined' && typeof window !== 'undefined')){
			var dbid = global.location.pathname.match(/^\/db\/(?!main)(.*)$/);

			if(dbid){
				return dbid[1];
			}
		}

		return '';
	})(),
	fid: -1
};

/* Main Class */
class QBField {

	constructor(options){
		this.className = QBField.className;

		this._qb = false;

		this._dbid = '';
		this._fid = -1;
		this._data = {};

		this._baselineChoices = [];

		if(options && options.quickbase && ((options.quickbase.className && options.quickbase.className === 'QuickBase') || typeof(options.quickbase.api) === 'function')){
			this._qb = options.quickbase;

			delete options.quickbase;
		}

		const settings = merge({}, QBField.defaults, options || {});

		this.setDBID(settings.dbid)
			.setFid(settings.fid);

		if(!this._qb){
			this._qb = new QuickBase(settings.quickbase);
		}

		return this;
	};

	clear(){
		this._dbid = '';
		this._fid = -1;
		this._data = {};

		this._baselineChoices = [];
	};

	delete(){
		return this._qb.api('API_DeleteField', {
			dbid: this.getDBID(),
			fid: this.getFid()
		}).then(() => {
			this.clear();

			return this;
		}).catch((err) => {
			if(err.code === 31){
				this.clear();

				return this;
			}

			throw err;
		});
	};

	get(attribute){
		if(attribute === 'dbid'){
			return this.getDBID();
		}else
		if(attribute === 'fid'){
			return this.getFid();
		}

		if(!this._data.hasOwnProperty(attribute)){
			return null;
		}

		return this._data[attribute];
	};

	getDBID(){
		return this._dbid;
	};

	getFid(){
		return this._fid;
	};

	load(){
		return this._qb.api('API_GetFieldProperties', {
			dbid: this.getDBID(),
			fid: this.getFid()
		}).then((results) => {
			Object.keys(results.field).forEach((attribute) => {
				const val = results.field[attribute];

				if(attribute === 'choices'){
					this._baselineChoices = val;
				}

				this.set(attribute, val);
			});

			return this;
		});
	};

	save(attributesToSave){
		const edit = () => {
			const options = {
				dbid: this.getDBID(),
				fid: this.getFid()
			};

			Object.keys(this._data).filter((attribute) => {
				return !attributesToSave || attributesToSave.indexOf(attribute) !== -1;
			}).forEach((attribute) => {
				options[attribute] = this.get(attribute);
			});

			return this._qb.api('API_SetFieldProperties', options).then(() => {
				if(!options.hasOwnProperty('choices')){
					return this;
				}

				const toRemove = [];
				const toAdd = [];

				options.choices.forEach((choice) => {
					if(this._baselineChoices.indexOf(choice) === -1){
						toAdd.push(choice);
					}
				});

				this._baselineChoices.forEach((choice) => {
					if(options.choices.indexOf(choice) === -1){
						toRemove.push(choice);
					}
				});

				return QuickBase.Promise.all([
					(toAdd.length > 0 ? this._qb.api('API_FieldAddChoices', {
						dbid: this.getDBID(),
						fid: this.getFid(),
						choice: toAdd
					}) : QuickBase.Promise.resolve()),
					(toRemove.length > 0 ? this._qb.api('API_FieldRemoveChoices', {
						dbid: this.getDBID(),
						fid: this.getFid(),
						choice: toRemove
					}) : QuickBase.Promise.resolve())
				]).then(() => {
					this._baselineChoices = options.choices;

					return this;
				});
			});
		};

		if(this.getFid() > 0){
			return edit();
		}

		return this._qb.api('API_AddField', {
			dbid: this.getDBID(),
			label: this.get('label'),
			mode: this.get('mode'),
			type: this.get('field_type')
		}).then((results) => {
			this.setFid(results.fid);

			return edit();
		});
	};

	set(attribute, value){
		if(attribute === 'dbid'){
			this.setDBID(value);
		}else
		if(attribute === 'fid'){
			this.setFid(value);
		}

		this._data[attribute] = value;

		return this;
	};

	setDBID(dbid){
		this._dbid = dbid;

		return this;
	};

	setFid(fid){
		this._fid = fid;

		return this;
	};

	toJson(attributesToConvert){
		const json = {};

		Object.keys(this._data).filter((attribute) => {
			return !attributesToConvert || attributesToConvert.indexOf(attribute) !== -1;
		}).forEach((attribute) => {
			json[attribute] = this.get(attribute);
		});

		return json;
	};

}

/* Static Methods */
QBField.NewField = (options, attributes) => {
	const field = new QBField(options);

	Object.keys(attributes).forEach((attribute) => {
		field.set(attribute, attributes[attribute]);
	});

	return field;
};

/* Expose Properties */
QBField.defaults = defaults;
QBField.className = 'QBField';

/* Expose Version */
QBField.VERSION = [ VERSION_MAJOR, VERSION_MINOR, VERSION_PATCH ].join('.');

/* Export Module */
if(typeof module !== 'undefined' && module.exports){
	module.exports = QBField;
}else
if(typeof define === 'function' && define.amd){
	define('QBField', [], function(){
		return QBField;
	});
}

if((typeof global !== 'undefined' && typeof window !== 'undefined' && global === window) || (typeof global === 'undefined' && typeof window !== 'undefined')){
	(global || window).QBField = QBField;
}
