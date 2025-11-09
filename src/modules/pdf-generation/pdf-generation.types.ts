export type TPdfGenerationResponse = {
  message: string;
  pdfBuffer: Uint8Array;
};

export enum EPdfFieldType {
  TEXTFIELD,
  CHECKBOX,
  RADIOBUTTON,
  DROPDOWN,
}

interface IPdfDataField<T, U extends EPdfFieldType> {
  label: string;
  data: T;
  type: U;
}

export interface ITextFieldMapper extends IPdfDataField<string, EPdfFieldType.TEXTFIELD> {}
export interface IRadioButtonMapper extends IPdfDataField<string, EPdfFieldType.RADIOBUTTON> {}
export interface ICheckboxMapper extends IPdfDataField<boolean, EPdfFieldType.CHECKBOX> {}
export interface IDropdownMapper extends IPdfDataField<string[] | string, EPdfFieldType.DROPDOWN> {}

export type TPdfFillMapperObject =
  | ITextFieldMapper
  | IRadioButtonMapper
  | ICheckboxMapper
  | IDropdownMapper;

type TDataTypeForPdfMapping = string | number | boolean | Date | undefined;
export type TDataDictionary = Record<string, TDataTypeForPdfMapping>;

export type TPdfFillMapper = {
  label: string;
  data: TDataTypeForPdfMapping;
  type: EPdfFieldType;
};
