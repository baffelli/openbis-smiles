export class FieldSorting{
    field: string
    asc: boolean
    status: "asc" | "desc" | "disabled"

    constructor(field: string, asc: boolean){
        this.field = field
        this.asc = asc
        this.status = "disabled"
    }

    public changeSortingStatus(): FieldSorting{
        var new_status
        if(this.status == "asc"){
            new_status = "desc"
        }else if(this.status === "desc"){
            new_status = "disabled"
        }else if(this.status == "disabled"){
            new_status = "asc"
        }
        return {status: new_status, field: this.field, asc: !this.asc} as FieldSorting
    }
}


export class FieldSortingManager{
    fields: FieldSorting[] | null

    constructor(){
        this.fields = []
    }

    public addField(field: FieldSorting){
        const idx = this.findFieldIndex(field.field)
        if(idx < 0){
            this.fields = [...this.fields, field]
        }

    }

    private findFieldIndex(fieldName: string): number{
        return this?.fields.findIndex((el) => el.field == fieldName)
    }

    public getField(fieldName: string): FieldSorting | null {
        const i = this.findFieldIndex(fieldName)
        return i>=0 ? this.fields[i] : null
    }

    public changeFieldStatus(fieldName: string){
        const fi = this.findFieldIndex(fieldName)
        if(fi >= 0){
            const nf = this.fields[fi].changeSortingStatus()
            this.fields[fi] = nf
        }
        
    }

    public getValidFields(){
        return this.fields.filter((fd)=> fd.status != 'disabled')
    }
}

