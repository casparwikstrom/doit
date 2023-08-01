
import PageTitle from '@/components/PageTitle'
import generateRss from '@/lib/generate-rss'
import YouTube from 'react-youtube'
import getConfig from 'next/config'
import { BlogSEO } from '@/components/SEO'
import siteMetadata from '@/data/siteMetadata'
import withTranslations from '@/components/withTranslations';
import Video from '../../models/Video';
import Link from '@/components/Link'
import classNames from 'classnames';


const { publicRuntimeConfig } = getConfig()
const isDevelopment = publicRuntimeConfig.isDevelopment

const domain = process.env.DOMAIN_URL


function YouTubeVideo({ url }) {
  const videoId = url.split('v=')[1]

  const opts = {
    playerVars: {
      // Enable autoplay
      autoplay: 1,
    },
    width: '100%',
  }
  return <YouTube videoId={videoId} opts={opts} />
}

export async function getStaticPaths() {
  // Add the supported languages here
  const languages = ['ru', 'fr', 'es', 'ro', 'hi', 'ar', 'pt', 'de'];


  const v = await fetch(isDevelopment ? `http://localhost:3001/api/v1/videos?domain=${domain}` : `https://you-b.herokuapp.com/api/v1/videos?domain=${domain}`);
  const videos = await v.json();

  const paths = languages.flatMap((lang) =>
    videos.map((video) => {

      return ({
        params: {
          slug: video.slug.toString(),
        },
        locale: lang,
      })
    })
  );

  const englishPaths = videos.map((video) => ({
    params: {
      slug: video.slug.toString(),
    },
    locale: 'en',
  }));

  return {
    paths: [...paths, ...englishPaths],
    fallback: false,
  };
}

// Update your getStaticProps function
// export async function getStaticProps({ params, locale }) {
//   const res = await fetch(isDevelopment ? `http://localhost:3001/api/v1/videos/${params.slug}` : `https://you-b.herokuapp.com/api/v1/videos/${params.slug}`);
//   const data = await res.json();
//   const video = new Video(data, locale);
//   const vid = Object.assign({}, video);

//   // rss
//   if (vid.length > 0) {
//     const rss = generateRss(vid);
//     fs.writeFileSync("../public/rss.xml", rss);
//   }

//   return { props: { vid } };
// }

// Update your getStaticProps function
export async function getStaticProps({ params, locale }) {
  const res = await fetch(
    isDevelopment
      ? `http://localhost:3001/api/v1/videos/${params.slug}`
      : `https://you-b.herokuapp.com/api/v1/videos/${params.slug}`
  );
  const data = await res.json();
  const video = new Video(data, locale);
  const vid = Object.assign({}, video);

  // Fetch all videos to find the index of the current video
  const allVideosRes = await fetch(
    isDevelopment
      ? `http://localhost:3001/api/v1/videos?domain=${domain}`
      : `https://you-b.herokuapp.com/api/v1/videos?domain=${domain}`
  );
  const allVideos = await allVideosRes.json();
  const currentIndex = allVideos.findIndex((v) => v.slug === params.slug);

  // Get the next video/article based on the current index
  const nextVideo = allVideos[currentIndex + 1];
  const priorVideo = allVideos[currentIndex - 1];

  // rss
  if (vid.length > 0) {
    const rss = generateRss(vid);
    fs.writeFileSync("../public/rss.xml", rss);
  }

  return { props: { vid, nextVideo, priorVideo } };
}


function Blog({ vid, metaData, nextVideo, priorVideo }) {

  return (
    <>
      <BlogSEO
        url={`${siteMetadata.siteUrl}/videos/${toString(vid.slug)}`}
        // authorDetails={authorDetails}
        type='article'
        thumbnails={vid?.video_info?.thumbnail?.thumbnails}
        metaData={metaData}
        {...vid}
      />

      <div className="flex justify-between">
        {priorVideo && (
          <div className="flex-shrink-0 flex-grow-0 w-1/2" style={{ maxWidth: '50%' }}>
            <Link href={`/videos/${priorVideo.slug}`}>
              <div
                className={classNames(
                  'flex items-center mt-2 text-blue-500 hover:underline',
                )}
              >
                <span className="mr-2">&larr;</span>
                <h4 className="truncate">
                  {priorVideo.name}
                </h4>
              </div>
            </Link>
          </div>
        )}

        {nextVideo && (
          <div className="flex-shrink-0 flex-grow-0 w-1/2" style={{ maxWidth: '50%'}}>
            <Link href={`/videos/${nextVideo.slug}`}>
              <div
                className={classNames(
                  'flex items-center mt-2 text-blue-500 hover:underline',
                )}
              >
                <h4 className="truncate">
                  {nextVideo.name}
                </h4>
                <span className="ml-2">&rarr;</span>
              </div>
            </Link>
          </div>
        )}
      </div>





      <PageTitle>
        <div dangerouslySetInnerHTML={{ __html: vid.name }} />
      </PageTitle>
      <div className="py-12" dangerouslySetInnerHTML={{ __html: vid.description }} />
      <YouTubeVideo url={vid.url} />

      <div className="py-12" dangerouslySetInnerHTML={{ __html: vid.summary }} />
    </>
  )
}


export default withTranslations(Blog);
