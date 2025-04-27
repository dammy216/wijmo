import React, { useEffect, useRef, useState } from 'react';
import { FlexGrid, FlexGridColumn, FlexGridColumnGroup, } from '@mescius/wijmo.react.grid';
import * as wjcGrid from '@mescius/wijmo.grid';
import { CompaniesModel, CompanyHyokaKmkModel, CompanyPointInfoModel, EngineerHyokaKmkModel, EngineerPointInfoModel, EngineersModel, EvaluationCompanyModel, EvaluationEngineerModel, EvaluationPointModel, GridDisplayModel } from './type';
import { TransposedGrid, TransposedGridRow } from '@mescius/wijmo.react.grid.transposed';
import { useRefState } from './hooks/useRefState';

type Props = {
  evaluationPoint: EvaluationPointModel;
  setEvaluationPoint: (evaluationPoint: EvaluationPointModel) => void;
  myCompanyId: number;
};

type DisplayCompanyGridModel = {
  companyId: number;
  [key: number]: number;
};

type DisplayEngineerGridModel = {
  companyId: number;
  engineerId?: number;
  engineerName?: string;
  [key: number]: number | string | undefined;
};

const MyCompanyEvaluation = (props: Props) => {
  const [evaluationCompany, setEvaluationCompany] = useRefState<EvaluationCompanyModel>(props.evaluationPoint?.EvaluationCompany);
  const [evaluationEngineer, setEvaluationEngineer] = useRefState<EvaluationEngineerModel>(props.evaluationPoint?.EvaluationEngineer);

  const [displayCompanyGrid, setDisplayCompanyGridModel] = useState<DisplayCompanyGridModel[]>([]);
  const [displayEngineerGrid, setDisplayEngineerGrid] = useState<DisplayEngineerGridModel[]>([]);
  const [isImportMaster, setIsImportMaster] = useState(false);

  useEffect(() => {
    console.log("会社リスト", evaluationCompany.current);

  }, [evaluationCompany.current]);

  useEffect(() => {

    console.log("技術者リスト", evaluationEngineer.current);

  }, [evaluationEngineer.current]);


  useEffect(() => {
    setEvaluationCompany(props.evaluationPoint?.EvaluationCompany);
    setEvaluationEngineer(props.evaluationPoint?.EvaluationEngineer);
    updateGridCompanyData();
    updateGridEngineerData();
  }, []);

  useEffect(() => {
    if (isImportMaster) {
      updateGridCompanyData();
      updateGridEngineerData();
    }
    setIsImportMaster(false);
  }, [isImportMaster]);

  const updateGridCompanyData = () => {
    const companyData: DisplayCompanyGridModel[] = evaluationCompany.current?.companies
      ?.filter(company => company.companyId === props.myCompanyId)
      .map((company) => {

        const companyPoints: Record<string, number | undefined> = {};
        evaluationCompany.current?.hyokaKmk?.forEach(kmk => {
          const info = company?.pointInfo?.find(p => p.hyokaKmkId === kmk.hyokaKmkId);
          companyPoints[kmk.hyokaKmkId] = info?.point;
        });

        return {
          companyId: company.companyId,
          ...companyPoints,
        };
      }) ?? [];

    setDisplayCompanyGridModel(companyData);
  };

  const updateGridEngineerData = () => {
    const engineerData: DisplayEngineerGridModel[] = evaluationEngineer.current?.engineers
    ?.filter(engineer => engineer.companyId === props.myCompanyId)
    .map((engineer) => {
      
      const engineerPoints: Record<string, number | undefined> = {};
      evaluationEngineer.current?.hyokaKmk?.forEach(kmk => {
        const info = engineer?.pointInfo?.find(p => p.hyokaKmkId === kmk.hyokaKmkId);
          engineerPoints[kmk.hyokaKmkId] = info?.point;
      });
      return {
        companyId: engineer.companyId,
        engineerId: engineer.engineerId,
        engineerName: engineer.engineerName,
        ...engineerPoints,
      };
    }) ?? [];

    setDisplayEngineerGrid(engineerData);
  };

  const initializedCompany = (control: wjcGrid.FlexGrid) => {
    attachAutoEdit(control);

  };
  const initializedEngineer = (control: wjcGrid.FlexGrid) => {
    attachAutoEdit(control);

  };

  const formatItem = (control: wjcGrid.FlexGrid, e: wjcGrid.FormatItemEventArgs) => {
    control.rowHeaders.columns[0].width = 100;
    if (e.panel == control.columnHeaders) {
      // 行ヘッダーのセルにname列の値を設定
      const rowData = control.itemsSource[e.col].engineerName;
      e.cell.innerHTML = rowData;
    }
  };

  const attachAutoEdit = (grid: wjcGrid.FlexGrid) => {
    grid.hostElement.addEventListener('mousedown', (e: MouseEvent) => {
      const ht = grid.hitTest(e);
      if (ht.cellType === wjcGrid.CellType.Cell) {
        setTimeout(() => grid.startEditing(true), 50);
      }
    });
  };

  const cellEditEndedCompany = (control: wjcGrid.FlexGrid, e: wjcGrid.CellRangeEventArgs) => {
    const editedRow = control.rows[e.row];
    const newValue = control.getCellData(e.row, e.col, false);
    const hyokaKmk: CompanyHyokaKmkModel[] = evaluationCompany.current?.hyokaKmk ?? [];

    const updatedCompanyPoint: CompaniesModel[] = evaluationCompany.current?.companies?.map((company) => {
      if (company.companyId === props.myCompanyId) {
        const companyPoint: CompaniesModel = {
          companyId: company.companyId,
          pointInfo: company.pointInfo?.map((point) => {
            if (point.hyokaKmkId === Number(editedRow.binding)) {
              return { ...point, point: newValue };
            }
            return point;
          })
        };
        return companyPoint;
      } else {
        return company;
      }
    }) ?? [];

    const companyInfo: EvaluationCompanyModel = {
      hyokaKmk: hyokaKmk,
      companies: updatedCompanyPoint
    };

    setEvaluationCompany(companyInfo);

  };

  const cellEditEndedEngineer = (control: wjcGrid.FlexGrid, e: wjcGrid.CellRangeEventArgs) => {
    const editedRow = control.rows[e.row];
    const newValue = control.getCellData(e.row, e.col, false);
    const hyokaKmk: EngineerHyokaKmkModel[] = evaluationEngineer.current?.hyokaKmk ?? [];

    const updatedEngineerPoint: EngineersModel[] = evaluationEngineer.current?.engineers?.map((engineer) => {
      if (engineer.companyId === props.myCompanyId && engineer.engineerId === control.itemsSource[e.col].engineerId) {
        const engineerPoint: EngineersModel = {
          companyId: engineer.companyId,
          engineerId: engineer.engineerId,
          engineerName: engineer.engineerName,
          pointInfo: engineer.pointInfo?.map((point) => {
            if (point.hyokaKmkId === Number(editedRow.binding)) {
              return { ...point, point: newValue };
            }
            return point;
          })
        };
        return engineerPoint;
      } else {
        return engineer;
      }
    }) ?? [];

    const engineerInfo: EvaluationEngineerModel = {
      hyokaKmk: hyokaKmk,
      engineers: updatedEngineerPoint
    };

    setEvaluationEngineer(engineerInfo);
  };

  const lostFocus = () => {
    props.setEvaluationPoint({ EvaluationCompany: evaluationCompany.current, EvaluationEngineer: evaluationEngineer.current });
  };

  const addMyCompanyData = () => {
    const getEvaluationCompanyData: EvaluationCompanyModel = {
      hyokaKmk: [
        { hyokaKmkId: 1, hyokaKmkName: '施工実績' },
        { hyokaKmkId: 2, hyokaKmkName: '騒音等' },
        { hyokaKmkId: 3, hyokaKmkName: '新規技術' },
      ],
      companies: [
        {
          companyId: props.myCompanyId,
          pointInfo: [
            { hyokaKmkId: 1, point: undefined },
            { hyokaKmkId: 2, point: undefined },
            { hyokaKmkId: 3, point: undefined }
          ]
        },
      ],
    };

    const getEvaluationEngineerData: EvaluationEngineerModel = {
      hyokaKmk: [
        { hyokaKmkId: 1, hyokaKmkName: '容姿' },
        { hyokaKmkId: 2, hyokaKmkName: '偏差値' },
        { hyokaKmkId: 3, hyokaKmkName: '性格' },
      ],
      engineers: [
        {
          companyId: props.myCompanyId,
          engineerId: 1,
          engineerName: "エンジニア1", // ★←これも必要なら追加
          pointInfo: [
            { hyokaKmkId: 1, point: undefined },
            { hyokaKmkId: 2, point: undefined },
            { hyokaKmkId: 3, point: undefined }
          ]
        },
        {
          companyId: props.myCompanyId,
          engineerId: 2,
          engineerName: "エンジニア2", // ★
          pointInfo: [
            { hyokaKmkId: 1, point: undefined },
            { hyokaKmkId: 2, point: undefined },
            { hyokaKmkId: 3, point: undefined }
          ]
        },
      ],
    };

    const evaluationPoint: EvaluationPointModel = {
      EvaluationCompany: getEvaluationCompanyData,
      EvaluationEngineer: getEvaluationEngineerData
    };

    setIsImportMaster(true);
    setEvaluationCompany(getEvaluationCompanyData);
    setEvaluationEngineer(getEvaluationEngineerData);
    props.setEvaluationPoint(evaluationPoint);
  };

  return (
    <>
      <h2>自社</h2>
      <div>
        <TransposedGrid itemsSource={displayCompanyGrid} autoGenerateRows={false} initialized={initializedCompany} cellEditEnded={cellEditEndedCompany} lostFocus={lostFocus}>
          {
            evaluationCompany.current?.hyokaKmk?.map(kmk => (
              <TransposedGridRow binding={`${kmk.hyokaKmkId}`} header={kmk.hyokaKmkName} dataType="Number" align="center" />
            ))
          }
        </TransposedGrid>
        <TransposedGrid itemsSource={displayEngineerGrid} autoGenerateRows={false} initialized={initializedEngineer} formatItem={formatItem} cellEditEnded={cellEditEndedEngineer} lostFocus={lostFocus} headersVisibility={wjcGrid.HeadersVisibility.All}>
          {
            evaluationEngineer.current?.hyokaKmk?.map(kmk => (
              <TransposedGridRow binding={`${kmk.hyokaKmkId}`} header={kmk.hyokaKmkName} dataType="Number" align="center" />
            ))
          }
        </TransposedGrid>
      </div>
      <button onClick={() => addMyCompanyData()}>項目を設定</button>
    </>
  );
};

export default MyCompanyEvaluation;