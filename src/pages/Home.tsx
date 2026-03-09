import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Info } from 'lucide-react';

export function Home() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4 py-12">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          云南大学 ICPC 校内选拔赛
        </h1>
        <p className="text-lg leading-8 text-gray-600">
          展现你的算法实力，争夺ICPC名额，开启你的竞赛之旅。
        </p>
        <div className="flex items-center justify-center gap-x-6">
          <Link to="/register">
            <Button size="lg" className="text-lg px-8">
              立即报名 <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            报名须知
          </CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none text-gray-600 space-y-4">
          <p>
            欢迎参加本次云南大学 ICPC 校内选拔赛！本次比赛由<strong>云南大学 ICPC 集训队老登及昆明理工大学 ICPC 选手</strong>共同出题。
            请在报名前仔细阅读以下须知：
          </p>

          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>参赛对象：</strong> 云南大学全校在读本科生、研究生均可报名。
              <ul className="list-disc pl-5 mt-1 text-red-600">
                <li>云南大学集训队所有正式队员及预备队员均需参加比赛，才能获得本赛季的比赛资格。</li>
                <li>队内成员如未参加比赛，也将视为放弃本赛季的组队资格。</li>
              </ul>
            </li>

            <li>
              <strong>比赛名额：</strong> 由于线下机房机位有限，预计提供70-80个参赛名额。
            </li>

            <li>
              <strong>报名时间：</strong> 即日起至3月12日24:00，滚动审核。
            </li>

            <li>
              <strong>比赛时间与地点：</strong>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>
                  <strong>热身赛：</strong>2026年3月14日 10:30 - 12:00，地点：软件学院1619、1620实验室
                </li>
                <li>
                  <strong>正式赛：</strong>2026年3月14日 13:00 - 18:00，地点：软件学院1619、1620实验室
                </li>
              </ul>
            </li>

            <li>
              <strong>比赛形式：</strong> 5h线下机房个人赛，通过在线判题系统（OJ）进行，届时将会和昆工同步进行校赛，共用榜单。
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>比赛平台：<strong>Hydro OJ</strong>（https://hydro.ac/）。</li>
                <li>
                  <strong>比赛赛制：</strong>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>
                      本次比赛采用 <strong>ICPC 赛制</strong>。
                    </li>
                    <li>
                      具体规则可参考：
                      <a
                        href="https://oi-wiki.org/contest/icpc/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline ml-1"
                      >
                        https://blog.pintia.cn/2018/08/01/acm-icpc-scoring-rule/
                      </a>
                    </li>
                    <li>
                      本次比赛将与 ICPC 系列正式比赛保持一致，在 <strong>比赛开始 4 小时后进行封榜，赛后进行滚榜</strong>。
                    </li>
                  </ul>
                </li>
                <li>比赛环境为<strong>机房内网环境</strong>，将<strong>断绝外网</strong>。</li>
                <li>比赛过程中<strong>不允许查看任何电子资料</strong>（包括网页、电子笔记等）。</li>
                <li>选手<strong>可以携带纸质资料</strong>（如打印模板、算法笔记等）。</li>
                <li>选手<strong>在正式赛开赛两小时后，即15点后才可离场，离场后不得有任何提交记录，否则取消比赛成绩。</strong></li>
              </ul>
            </li>

            <li>
              <strong>参赛奖励：</strong>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>比赛按照 <strong>5% / 10% / 25%</strong> 的比例发放金、银、铜奖。</li>
                <li>人数基数以实际到场签到人数为准，按获奖比例计算的获奖人数统一向上取整。</li>
                <li>
                  <strong>所有参赛选手均可获得官方活动证明，获奖选手还将额外获得获奖证书与奖品。</strong>
                </li>
              </ul>
            </li>

            <li>
              <strong>简历可填写内容：</strong>
              <ul className="list-circle pl-5 mt-1 space-y-1">
                <li>
                  <strong>平台数据：</strong> 可填写 Codeforces、AtCoder、牛客、洛谷四个平台的 Rating 或刷题量（仅认可以上四个平台，需附上用户名）。
                </li>
                <li>
                  <strong>获奖经历：</strong> 我们认可的算法比赛经历包括：百度之星、码蹄杯程序设计大赛、蓝桥杯、天梯赛、以往由我校 ICPC 集训队举办的比赛、CSP认证成绩及CCF举办的算法竞赛等。
                </li>
              </ul>
            </li>

            <li>
              <strong>特别提醒：</strong>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-2 text-sm text-yellow-700">
                <p className="font-bold mb-1">
                  由于本次比赛采取线下内网方式进行，机位有限，我们将根据大家提交的简历择优录取。
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>请真心想参加比赛的同学认真填写报名表。</li>
                  <li>我们将偏向于录取年轻选手。</li>
                  <li>
                    没有太多比赛经历的低年级同学，请在简历中着重体现自己的各平台刷题量或算法学习情况，
                    <strong>获奖经历并非必要条件</strong>。
                  </li>
                </ul>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
