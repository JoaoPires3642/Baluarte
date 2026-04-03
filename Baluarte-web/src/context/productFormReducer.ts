import type { ProductFormDraft, ProductFormStep } from "../components/admin/ProductFormTypes";

export type ProductFormState = {
  isCreateOpen: boolean;
  createStep: ProductFormStep;
  createDraft: ProductFormDraft;
  createImageUrl: string;
  createSubmitting: boolean;
  createErrors: string[];
  editingProductId: string | null;
  isEditOpen: boolean;
  editStep: ProductFormStep;
  editDraft: ProductFormDraft | null;
  editImageUrl: string;
  editErrors: string[];
  openSelectKey: string | null;
  selectSearch: Record<string, string>;
};

export type ProductFormAction =
  | { type: "OPEN_CREATE"; payload: { createDraft: ProductFormDraft } }
  | { type: "OPEN_EDIT"; payload: { editingProductId: string; editDraft: ProductFormDraft } }
  | { type: "CLOSE_CREATE" }
  | { type: "CLOSE_EDIT" }
  | { type: "SET_CREATE_STEP"; payload: ProductFormStep }
  | { type: "SET_EDIT_STEP"; payload: ProductFormStep }
  | { type: "SET_CREATE_DRAFT"; payload: ProductFormDraft }
  | { type: "SET_EDIT_DRAFT"; payload: ProductFormDraft | null }
  | { type: "SET_CREATE_IMAGE_URL"; payload: string }
  | { type: "SET_EDIT_IMAGE_URL"; payload: string }
  | { type: "SET_CREATE_SUBMITTING"; payload: boolean }
  | { type: "SET_CREATE_ERRORS"; payload: string[] }
  | { type: "SET_EDIT_ERRORS"; payload: string[] }
  | { type: "SET_OPEN_SELECT_KEY"; payload: string | null }
  | { type: "SET_SELECT_SEARCH"; payload: Record<string, string> }
  | { type: "SET_EDITING_PRODUCT_ID"; payload: string | null };

export const createInitialProductFormState = (initialDraft: ProductFormDraft): ProductFormState => ({
  isCreateOpen: false,
  createStep: 1,
  createDraft: initialDraft,
  createImageUrl: "",
  createSubmitting: false,
  createErrors: [],
  editingProductId: null,
  isEditOpen: false,
  editStep: 1,
  editDraft: null,
  editImageUrl: "",
  editErrors: [],
  openSelectKey: null,
  selectSearch: {}
});

export const productFormReducer = (state: ProductFormState, action: ProductFormAction): ProductFormState => {
  switch (action.type) {
    case "OPEN_CREATE":
      return {
        ...state,
        isCreateOpen: true,
        isEditOpen: false,
        createStep: 1,
        createDraft: action.payload.createDraft,
        createImageUrl: "",
        createErrors: [],
        openSelectKey: null
      };
    case "OPEN_EDIT":
      return {
        ...state,
        isCreateOpen: false,
        isEditOpen: true,
        editingProductId: action.payload.editingProductId,
        editDraft: action.payload.editDraft,
        editStep: 1,
        editImageUrl: "",
        editErrors: [],
        openSelectKey: null
      };
    case "CLOSE_CREATE":
      return { ...state, isCreateOpen: false };
    case "CLOSE_EDIT":
      return { ...state, isEditOpen: false };
    case "SET_CREATE_STEP":
      return { ...state, createStep: action.payload };
    case "SET_EDIT_STEP":
      return { ...state, editStep: action.payload };
    case "SET_CREATE_DRAFT":
      return { ...state, createDraft: action.payload };
    case "SET_EDIT_DRAFT":
      return { ...state, editDraft: action.payload };
    case "SET_CREATE_IMAGE_URL":
      return { ...state, createImageUrl: action.payload };
    case "SET_EDIT_IMAGE_URL":
      return { ...state, editImageUrl: action.payload };
    case "SET_CREATE_SUBMITTING":
      return { ...state, createSubmitting: action.payload };
    case "SET_CREATE_ERRORS":
      return { ...state, createErrors: action.payload };
    case "SET_EDIT_ERRORS":
      return { ...state, editErrors: action.payload };
    case "SET_OPEN_SELECT_KEY":
      return { ...state, openSelectKey: action.payload };
    case "SET_SELECT_SEARCH":
      return { ...state, selectSearch: action.payload };
    case "SET_EDITING_PRODUCT_ID":
      return { ...state, editingProductId: action.payload };
    default:
      return state;
  }
};
