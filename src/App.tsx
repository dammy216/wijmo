import React, { useEffect, useState } from 'react';
import EvaluationPoint from './EvaluationPoint';
import MyCompanyEvaluation from './MyCompanyEvaluation';
import { EvaluationPointModel, participatingCompaniesModel } from './type';
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

  const addNewCompany = (newCompanyId: number, newCompanyName: string) => {
    setParticipatingCompanies(prevCompanies => [...prevCompanies, { companyId: newCompanyId, companyName: newCompanyName }]);
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
      {displayEvaluation ?
        <EvaluationPoint evaluationPoint={evaluationPoint.current} setEvaluationPoint={setEvaluationPoint} myCompanyId={myCompanyId} participatingCompanies={participatingCompanies} />
        :
        <MyCompanyEvaluation evaluationPoint={evaluationPoint.current} setEvaluationPoint={setEvaluationPoint} myCompanyId={myCompanyId} />}
    </div>
  );
};

export default App;