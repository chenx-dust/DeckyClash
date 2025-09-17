import { useState } from 'react'
import Swal from 'sweetalert2'
import axios from 'axios'
import color from 'tailwindcss/colors'
import withReactContent from 'sweetalert2-react-content'
import { useTranslation } from 'react-i18next';

function App() {
  const [url, setUrl] = useState("");
  const [t, i18n] = useTranslation();

  const getColorSet = () => {
    // get theme settings for swal
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
  const onDownloadBtnClick = (url) => {
    const colorSet = getColorSet();
    Swal.fire({
      iconColor: colorSet.icon,
      confirmButtonColor: colorSet.button,
      background: colorSet.background,
      color: colorSet.text,
      icon: "info",
      title: t('loading'),
      text: t('loading-msg'),
    });
    Swal.showLoading(null);
    axios.get("/download_sub", {
      params: { link: url.trim() },
      validateStatus: (_) => true
    }).then((response) => {
      console.log(response);
      if (response.status === 200) {
        withReactContent(Swal).fire({
          iconColor: colorSet.icon,
          confirmButtonColor: colorSet.button,
          background: colorSet.background,
          color: colorSet.text,
          icon: 'success',
          title: t('success'),
          text: t('success-msg'),
        });
      } else {
        withReactContent(Swal).fire({
          iconColor: colorSet.icon,
          confirmButtonColor: colorSet.button,
          background: colorSet.background,
          color: colorSet.text,
          icon: 'error',
          title: t('backend-err'),
          html:
            <div>
              <b>{t('resp-status')}</b>
              <code>
                {response.status}
              </code>
              <br />
              <b>{t('err-msg')}</b>
              <code>
                {response.data?.error}
              </code>
            </div>,
        });
      }
    }).catch(error => {
      withReactContent(Swal).fire({
        iconColor: colorSet.icon,
        confirmButtonColor: colorSet.button,
        background: colorSet.background,
        color: colorSet.text,
        icon: 'error',
        title: t('frontend-err'),
        html:
          <div>
            <b>{t('err-name')}</b>
            <code>
              {error.name}
            </code>
            <br />
            <b>{t('err-msg')}</b>
            <code>
              {error?.message}
            </code>
          </div>,
      });
    });
  }

  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      onDownloadBtnClick(url);
    }
  };

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className='flex justify-center items-center min-h-screen flex-col gap-4 bg-white dark:bg-gray-900'>
      <h1 className='text-6xl text-gray-800 dark:text-gray-200 text-center'>
        Decky Clash
      </h1>
      <p className='px-2 text-gray-500 dark:text-gray-400 text-center'>
        {t('import-tip')}
      </p>
      <div className='w-full flex justify-center px-4 h-12'>
        <input id="input-url" className='grow
          bg-gray-100
          dark:bg-gray-200
          text-xl
          pl-5
          rounded-l-full
          text-gray-700
          max-w-200
          dark:text-gray-900' type="text" placeholder={t('sub-link')} value={url} onChange={handleUrlChange} onKeyDown={handleKeyPress} />
        <button className='w-12
          bg-indigo-500
          dark:bg-indigo-700
          flex
          justify-center
          items-center
          rounded-r-full' onClick={() => { onDownloadBtnClick(url) }}>
          <svg className="h-6 w-6" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.0228571 48L48 24L0.0228571 0L0 18.6667L34.2857 24L0 29.3333L0.0228571 48Z" fill="white" />
          </svg>
        </button>
      </div>
      <div className="mb-2">
        <span className="px-2 text-gray-500 dark:text-gray-400 text-center">{t("sel-lang")}</span>
        <select
          value={i18n.language}
          onChange={handleLanguageChange}
          className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg px-3 py-1 text-sm"
        >
          <option value="zh-CN">中文（中国）</option>
          <option value="en">English</option>
        </select>
      </div>
    </div>
  );
}

export default App
