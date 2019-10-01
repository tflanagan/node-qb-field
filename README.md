# QBField
=========

A lightweight abstraction layer for QuickBase

### Initialization
--------------

```js
const record = new QBField({
	quickbase: {
		realm: '',
		appToken: ''
	},
	// quickbase: QuickBase Instance
	dbid: '' // defaults to dbid in url if found
	fid: -1
});
```

### Methods
-------

#### `.clear()`
This method clears the QBField instance of any trace of the existing field,
but preserves defined connection settings.

#### `.delete()`
This method deletes the field from QuickBase, then calls `.clear()`.

#### `.get(attribute)`
 - `name`: string, required

#### `.getDBID()`
This method returns the DBID.

#### `.getFid()`
This method returns the Field ID.

#### `.load()`
This method executes an API_GetFieldProperties for the stored Field ID attributes.

#### `.save(attributesToSave)`
 - `attributesToSave`: array, defaults to undefined

If a field id is not defined, this will execute an API_AddField. After a 
successful API_AddField, or if a field id was previously defined, this will
execute an API_EditFieldProperties. If `choices` are defined for the field, 
then appropriate API_FieldAddChoices and API_FieldRemoveChoices are executed.

If `attributesToSave` is defined, then only configured attributes in this 
array will be saved.

If this executes an API_AddField, the newly assigned Field ID is
automatically stored internally.

#### `.set(attribute, value)`
 - `attribute`: string, required
 - `value`: mixed, required

This method sets the passed in `value` associated with the `attribute` argument.

#### `.setDBID(dbid)`
 - `dbid`: string, required

Sets the `dbid` setting.

#### `.setFid(fid)`
 - `fid`: integer, required

Sets the `fid` setting.

#### `.toJson(attributesToConvert)`
 - `attributesToConvert`: array, optional

 returns the field as a JSON object
