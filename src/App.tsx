import React, { useEffect, useState } from 'react';
import EvaluationPoint from './EvaluationPoint';
import MyCompanyEvaluation from './MyCompanyEvaluation';
import { BidResultDisplayModel, EngineerHyokaKmkModel, EngineersModel, EvaluationEngineerModel, EvaluationPointModel, participatingCompaniesModel } from './type';
import { useRefState } from './hooks/useRefState';

const initData: EvaluationPointModel = {
  EvaluationCompany: {
    hyokaKmk: [],
    companies: []
  },
  EvaluationEngineer: {
    hyokaKmk: [],
    engineers: []
  }
};



const myCompanyId: number = 5000;

const App = () => {
  const [displayEvaluation, setDisplayEvaluation] = useState(false);
  const [evaluationPoint, setEvaluationPoint] = useRefState<EvaluationPointModel>(localStorage.getItem('evaluationPoint') ? JSON.parse(localStorage.getItem('evaluationPoint')!) : initData);
  const [participatingCompanies, setParticipatingCompanies] = useState<participatingCompaniesModel[]>([]);
  const [isUpdateEngineer, setIsUpdateEngineer] = useState(false);
  const [bidResultDisplayData, setBidResultDisplayData] = useState<BidResultDisplayModel[]>([]);

  useEffect(() => {
    console.log("bidResultDisplayData", bidResultDisplayData);

  }, [bidResultDisplayData]);

  useEffect(() => {
    const newBidResults: BidResultDisplayModel[] = participatingCompanies.map(company => {
      const companyId = company.companyId;

      // --- 会社のpointInfo合計を算出 ---
      const companyData = evaluationPoint.current.EvaluationCompany.companies?.find(c => c.companyId === companyId);
      const companyAbility = companyData?.pointInfo?.reduce((sum, p) => sum + (p.point ?? 0), 0) ?? 0;

      // --- 技術者のpointInfo合計を算出（同じcompanyIdの技術者たち）---
      const engineerList = evaluationPoint.current.EvaluationEngineer.engineers?.filter(e => e.companyId === companyId) ?? [];

      // 各技術者ごとの合計点を出す
      const engineerPointSums = engineerList.map(engineer =>
        engineer.pointInfo?.reduce((sum, p) => sum + (p.point ?? 0), 0) ?? 0
      );

      // 最も点数が低い技術者の点数を取得（いなければ0）
      const engineerAbility = engineerPointSums.length > 0 ? Math.min(...engineerPointSums) : 0;


      return {
        companyId: companyId,
        companyName: company.companyName,
        companyAbility,
        engineerAbility
      };
    });

    setBidResultDisplayData(newBidResults);
  }, [evaluationPoint.current, participatingCompanies]);

  const addNewCompany = (newCompanyId: number, newCompanyName: string) => {
    setParticipatingCompanies(prevCompanies => [...prevCompanies, { companyId: newCompanyId, companyName: newCompanyName }]);
  };

  const addNewEngineer = () => {
    const hyokaKmkList = evaluationPoint.current.EvaluationEngineer.hyokaKmk ?? [];
    const existingEngineers = evaluationPoint.current.EvaluationEngineer.engineers ?? [];

    const newEngineerId =
      existingEngineers.length > 0
        ? Math.max(...existingEngineers.map(e => e.engineerId ?? 0)) + 1
        : 1;

    const newEngineer: EngineersModel = {
      companyId: myCompanyId,
      engineerId: newEngineerId,
      engineerName: `技術者${newEngineerId}`,
      pointInfo: hyokaKmkList.map(item => ({
        hyokaKmkId: item.hyokaKmkId,
        point: undefined // 初期は未入力としておく
      }))
    };

    const evaluationEngineer: EvaluationEngineerModel = {
      hyokaKmk: hyokaKmkList,
      engineers: [...existingEngineers, newEngineer]
    };

    setEvaluationPoint({
      EvaluationCompany: evaluationPoint.current.EvaluationCompany,
      EvaluationEngineer: evaluationEngineer
    });
    setIsUpdateEngineer(true);
  };


  return (
    <div>
      <div>
        <button onClick={() => setDisplayEvaluation(!displayEvaluation)}>表示切り替え</button>
      </div>
      <br />
      <button onClick={() => addNewCompany(myCompanyId, '自社')}>自社を追加</button>
      <button onClick={() => addNewCompany(participatingCompanies.length + 1, `企業${participatingCompanies.length + 1}`)}>他社を追加</button>
      <button onClick={() => setParticipatingCompanies([])}>会社を削除</button>
      <button onClick={addNewEngineer}>技術者を追加</button>
      <button onClick={() => setEvaluationPoint(initData)}>技術者を削除</button>
      {displayEvaluation ?
        <EvaluationPoint evaluationPoint={evaluationPoint.current} setEvaluationPoint={setEvaluationPoint}
          myCompanyId={myCompanyId}
          participatingCompanies={participatingCompanies}
          isUpdateEngineer={isUpdateEngineer} setIsUpdateEngineer={setIsUpdateEngineer}
          bidResultDisplayData={bidResultDisplayData} />
        :
        <MyCompanyEvaluation evaluationPoint={evaluationPoint.current} setEvaluationPoint={setEvaluationPoint} myCompanyId={myCompanyId} isUpdateEngineer={isUpdateEngineer} setIsUpdateEngineer={setIsUpdateEngineer} />}
    </div>
  );
};

export default App;