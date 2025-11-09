import { Injectable } from "@nestjs/common";

import { PDFCheckBox, PDFDocument, PDFForm, PDFRadioGroup, PDFTextField } from "@cantoo/pdf-lib";
import dayjs from "dayjs";
import { readFile } from "fs/promises";

import { FileUploadsService } from "@/modules/file-uploads/file-uploads.service";

import {
  ICheckboxMapper,
  IDropdownMapper,
  EPdfFieldType,
  TPdfFillMapperObject,
  IRadioButtonMapper,
  ITextFieldMapper,
  TDataDictionary,
  TPdfFillMapper,
} from "./pdf-generation.types";

@Injectable()
export class PdfGenerationService {
  constructor(private readonly fileUploadService: FileUploadsService) {}

  async generatePdf(
    templatePath: string,
    pdfFillData: TPdfFillMapperObject[],
    outputPdfFileName: string,
  ) {
    const pdfArrayBuffer = await this.loadPdfDocument(templatePath);
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
    const form = pdfDoc.getForm();

    pdfFillData.forEach((fillData) => {
      this.mapDataToFormField(fillData, form);
    });
    form.flatten();

    const pdfBuffer = await pdfDoc.save();
    const { name, signedUrl } = await this.savePdf(Buffer.from(pdfBuffer), outputPdfFileName);
    return {
      pdfBuffer,
      name,
      signedUrl,
    };
  }

  async generateNewPdf(
    templatePath: string,
    outputPdfFileName: string,
    mapData: TDataDictionary,
    flattenOnCompletion: boolean = false,
  ) {
    const pdfArrayBuffer = await this.loadPdfDocument(templatePath);
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
    const pdfBuffer = await this.applyDataToPdf(pdfDoc, mapData, flattenOnCompletion);

    const { name, signedUrl } = await this.savePdf(Buffer.from(pdfBuffer), outputPdfFileName);
    return {
      pdfBuffer,
      name,
      signedUrl,
    };
  }

  private savePdf(pdfBuffer: Buffer, outputPdfFileName: string) {
    const outputFileNameWithTimestamp = `${outputPdfFileName}_${Date.now()}.pdf`;
    return this.fileUploadService.uploadFileBuffer(
      outputFileNameWithTimestamp,
      "application/pdf",
      pdfBuffer,
    );
  }

  private loadPdfDocument(filePath: string): Promise<ArrayBuffer> {
    return readFile(filePath);
  }

  private mapDataToFormField(fillDataObject: TPdfFillMapperObject, form: PDFForm) {
    if (fillDataObject.type === EPdfFieldType.TEXTFIELD) {
      this.fillTextField(fillDataObject, form);
    } else if (fillDataObject.type === EPdfFieldType.CHECKBOX) {
      this.fillCheckbox(fillDataObject, form);
    } else if (fillDataObject.type === EPdfFieldType.DROPDOWN) {
      this.fillDropdown(fillDataObject, form);
    } else if (fillDataObject.type === EPdfFieldType.RADIOBUTTON) {
      this.fillRadioButton(fillDataObject, form);
    }
  }

  private fillTextField(fillDataObject: ITextFieldMapper, form: PDFForm) {
    form.getTextField(fillDataObject.label).setText(fillDataObject.data);
  }

  private fillCheckbox(fillDataObject: ICheckboxMapper, form: PDFForm) {
    if (fillDataObject.data === true) form.getCheckBox(fillDataObject.label).check();
  }

  private fillDropdown(fillDataObject: IDropdownMapper, form: PDFForm) {
    const fillDataSet = new Set(fillDataObject.data);
    const dropdown = form.getDropdown(fillDataObject.label);
    const options = dropdown.getOptions();

    dropdown.select(options.filter((option) => fillDataSet.has(option)));
  }

  private fillRadioButton(fillDataObject: IRadioButtonMapper, form: PDFForm) {
    const dropdown = form.getRadioGroup(fillDataObject.label);
    const selectedOption = dropdown.getOptions().find((option) => option === fillDataObject.data);

    if (selectedOption) dropdown.select(selectedOption);
  }

  private applyDataToPdf(
    pdfDoc: PDFDocument,
    pdfData: TDataDictionary,
    flattenOnCompletion: boolean,
  ) {
    const fields = this.getPdfFields(pdfDoc.getForm());
    const updatedFields = fields.map<TPdfFillMapper>((field) => ({
      ...field,
      data: pdfData[field.label],
    }));

    return this.setValuesForPdfAndSave(pdfDoc, updatedFields, flattenOnCompletion);
  }

  private fillRadioButtonField(field: TPdfFillMapper, pdfField: PDFRadioGroup) {
    if (field.data === undefined) {
      return;
    }

    let fieldValue;
    if (typeof field.data === "boolean") {
      fieldValue = field.data ? "Choice1" : "Choice2";
    } else {
      fieldValue = String(field.data || "");
    }
    if (!pdfField.getOptions().includes(fieldValue)) {
      return;
    }
    return pdfField.select(fieldValue);
  }

  private setValuesForPdfAndSave(
    pdfDoc: PDFDocument,
    fields: TPdfFillMapper[],
    flattenOnCompletion: boolean,
  ): Promise<Uint8Array> {
    const pdfForm = pdfDoc.getForm();
    fields.forEach((field) => {
      const pdfField = pdfForm.getField(field.label);
      if (pdfField instanceof PDFTextField) {
        if (field.data instanceof Date) {
          field.data = dayjs(field.data).format("YYYY/MM/DD");
        }
        return pdfField.setText(String(field.data || ""));
      } else if (pdfField instanceof PDFCheckBox) {
        if (field.data) {
          pdfField.check();
        } else {
          pdfField.uncheck();
        }
      } else if (pdfField instanceof PDFRadioGroup) {
        this.fillRadioButtonField(field, pdfField);
      } else {
        throw new Error("unsupported field");
      }
    });

    if (flattenOnCompletion) {
      pdfDoc.getForm().flatten();
    }
    return pdfDoc.save();
  }

  private getPdfFields(pdfForm: PDFForm): TPdfFillMapper[] {
    const formFields = pdfForm.getFields().reduce<TPdfFillMapper[]>((acc, field) => {
      const name = field.getName();
      if (field instanceof PDFTextField) {
        acc.push({
          type: EPdfFieldType.TEXTFIELD,
          label: name,
          data: field.getText(),
        });
      } else if (field instanceof PDFCheckBox) {
        acc.push({
          type: EPdfFieldType.CHECKBOX,
          label: name,
          data: field.isChecked(),
        });
      } else if (field instanceof PDFRadioGroup) {
        acc.push({
          type: EPdfFieldType.RADIOBUTTON,
          label: name,
          data: field.getSelected(),
        });
      }
      return acc;
    }, []);
    return formFields;
  }
}
