
type validDataTypes = 'string' | 'boolean' | 'number' | 'object' | 'date';

export interface PropertyMapping {
    commonName: string
    openbisPropertyName: string
    dataType: validDataTypes
}

export interface OpenbisObjectConfiguration {
    openbisType: string
    properties: PropertyMapping[]
}

export interface MappedOpenbisObjectEntry{
    name: string,
    value: object,
    dataType: validDataTypes
}

export interface MappedOpenbisObject{
    [k: string]: MappedOpenbisObjectEntry
}


export function expandObject(data: object, config: OpenbisObjectConfiguration): MappedOpenbisObject {
    const pairs = Object.entries(data).map(
        ([key, value]) => {
            const props = config.properties.find(element => element.commonName == key);
            if (props) {
                const newData = {
                    name: key,
                    value: value.value,
                    dataType: props.dataType
                }
                return [key, newData]
            }

        }
    )
    return Object.fromEntries(pairs.filter(x => x))
}