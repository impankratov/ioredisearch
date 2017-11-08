export class SortbyField {
  public args: string[];
  constructor(field: string, asc = true) {
    this.args = [field, asc ? 'ASC' : 'DESC'];
  }
}
