import { useState } from 'react'
import Swal from 'sweetalert2'
import axios from 'axios'
import color from 'tailwindcss/colors'

function App() {
  const [url, setUrl] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  const handleToggleChange = () => {
    setIsSubscribed(!isSubscribed);
  };

  return (
    <div className='flex justify-center items-center min-h-screen bg-white dark:bg-gray-900'>
      <div className='container grid grid-cols-12'>
        <div className='col-span-12 lg:col-start-2 lg:col-span-10'>
          <div className='flex justify-center items-center min-h-screen flex-col gap-4'>
            <h1 className='text-6xl text-gray-800 dark:text-gray-200 text-center'>
              To Moon
            </h1>
            <p className='px-2 text-gray-500 dark:text-gray-400 text-center'>
              支持 Mihomo/Clash 订阅
            </p>
            <div className='w-full flex px-2 h-12'>
              <input id="input-url" className='grow
              bg-gray-100
              dark:bg-gray-200
              text-xl
              pl-5
              rounded-l-full
              text-gray-700
              dark:text-gray-900' type="text" placeholder='订阅链接' value={url} onChange={handleUrlChange} />
              <button className='w-12
                bg-indigo-500
                dark:bg-indigo-700
                flex
                justify-center
                items-center
                rounded-r-full' onClick={() => { onDownloadBtnClick(url, isSubscribed) }}>
                <svg className="h-6 w-6" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.0228571 48L48 24L0.0228571 0L0 18.6667L34.2857 24L0 29.3333L0.0228571 48Z" fill="white" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const getColorSet = () => {
  // 根据 tailwind 是否夜间主题判断
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? {
      icon: color.indigo[400],
      background: color.gray[900],
      text: color.gray[200],
      button: color.indigo[500]
    }
    : {
      icon: color.indigo[400],
      background: color.gray[50],
      text: color.gray[800],
      button: color.indigo[500]
    };
};
const onDownloadBtnClick = (url, isSubscribed) => {
  const colorSet = getColorSet();
  let baseHost = '/';
  if (import.meta.env.DEV) {
    baseHost = 'http://127.0.0.1:55556/';
  }
  Swal.fire({
    iconColor: colorSet.icon,
    confirmButtonColor: colorSet.button,
    background: colorSet.background,
    color: colorSet.text,
    title: "下载中",
    text: "正在下载订阅配置，请稍等......",
    icon: "info"
  });
  Swal.showLoading(null);
  axios.post(baseHost + "download_sub", {
    link: url.trim(),
    subconv: isSubscribed
  }, {
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
  }).then((response) => {
    if (response.status === 200) {
      Swal.fire({
        iconColor: colorSet.icon,
        confirmButtonColor: colorSet.button,
        background: colorSet.background,
        color: colorSet.text,
        icon: 'success',
        title: '完成',
        text: '已添加订阅',
      });
    } else {
      Swal.fire({
        iconColor: colorSet.icon,
        confirmButtonColor: colorSet.button,
        background: colorSet.background,
        color: colorSet.text,
        icon: 'error',
        title: '后端失败',
        html: `<b>错误状态: </b>
        <code>
          ${response.status}
        </code>
        <br>
        <b>错误信息: </b>
        <code>
          ${response.data?.error?.message}
        </code>`,
      });
    }
  }).catch(error => {
    Swal.fire({
      iconColor: colorSet.icon,
      confirmButtonColor: colorSet.button,
      background: colorSet.background,
      color: colorSet.text,
      icon: 'error',
      title: '请求失败',
      html: `<b>错误类型: </b>
      <code>
        ${error.name}
      </code>
      <br>
      <b>错误信息: </b>
      <code>
      ${error?.message}
      </code>`,
    });
  });

}

export default App
