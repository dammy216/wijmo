
export type GridDisplayModel = {
  companyId: number;
  companyName: string;
  [key: string]: number | string;
};

export type participatingCompaniesModel = {
  companyId: number,
  companyName: string,
};

export type EvaluationPointModel = {
  EvaluationCompany: EvaluationCompanyModel,
  EvaluationEngineer: EvaluationEngineerModel;
};


// 会社関連-------------------------------------------------------------

export type CompanyHyokaKmkModel = {
  hyokaKmkId: number;
  hyokaKmkName: string;
};

export type CompanyPointInfoModel = {
  engineerId?: number;
  hyokaKmkId: number;
  point?: number;
};

export type CompaniesModel = {
  companyId: number,
  pointInfo?: CompanyPointInfoModel[];
};

export type EvaluationCompanyModel = {
  hyokaKmk?: CompanyHyokaKmkModel[],
  companies?: CompaniesModel[];
};

//---------技術者関連-------------------------------------------------------

export type EngineerHyokaKmkModel = {
  hyokaKmkId: number;
  hyokaKmkName: string;
};

export type EngineerPointInfoModel = {
  hyokaKmkId: number;
  point?: number;
};

export type EngineersModel = {
  companyId: number,
  engineerId?: number,
  engineerName?: string,
  pointInfo?: EngineerPointInfoModel[];
};

export type EvaluationEngineerModel = {
  hyokaKmk?: EngineerHyokaKmkModel[],
  engineers?: EngineersModel[];
};